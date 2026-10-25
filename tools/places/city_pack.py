#!/usr/bin/env python3
"""Build a Fermat destination pack for any city from free, open data.

Usage (run from anywhere, stdlib only, isolated mode recommended):

    python3 -I tools/places/city_pack.py "Las Vegas" --country US
    python3 -I tools/places/city_pack.py --batch            # every city in cities.json
    python3 -I tools/places/city_pack.py "Hampi" --offline  # cache only, no network

Sources (see docs/places-pipeline.md for reachability, limits and licences):
  * Wikivoyage MediaWiki API  - the city article (+ district articles for huge
    cities): curated See/Do listings and markers, coordinates, tourist office URL.
  * Wikidata SPARQL           - city QID facts (country, ISO code, currency,
    population, coordinates), attractions near the centre, sitelink counts,
    classes (instance of), heritage designation, neighbourhood.
  * Wikimedia pageviews API   - 12 months of English Wikipedia views per
    attraction: the main popularity signal.
  * World Bank API            - PPP conversion factor for household consumption
    (PA.NUS.PRVT.PP, local currency per international dollar) to price costs
    in the local currency.
  * tz database zone1970.tab  - nearest IANA time zone for the country.

Every raw HTTP response is cached under tools/places/cache/ so reruns are
offline and deterministic. Each source fails independently; the pack records
which sources were used in meta.sources.
"""

import argparse
import hashlib
import json
import math
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(HERE, 'cache')
PACK_DIR = os.path.join(HERE, 'packs')
CITIES_FILE = os.path.join(HERE, 'cities.json')
USER_AGENT = 'FermatPlacesPipeline/0.1 (group trip planner prototype; offline pack builder; https://github.com/fermatlabs)'
GENERATED_ON = time.strftime('%Y-%m-%d')
PACK_MONTH = time.strftime('%Y-%m')
PAGEVIEW_WINDOW = ('20251001', '20260930')  # last 12 complete months at build time
TAGS = ['food', 'culture', 'nightlife', 'shopping', 'art', 'beach', 'nature', 'adventure']

# Per-host politeness: seconds between live requests. Wikivoyage returns 429
# after ~12 rapid requests, so it gets the slowest pace.
THROTTLE = {
    'en.wikivoyage.org': 1.5,
    'query.wikidata.org': 1.0,
    'wikimedia.org': 0.15,
    'api.worldbank.org': 0.3,
}
_last_hit = {}
OFFLINE = False


class SourceError(Exception):
    pass


# --------------------------------------------------------------------------
# HTTP with cache
# --------------------------------------------------------------------------

def _cache_path(url):
    host = urllib.parse.urlparse(url).netloc
    digest = hashlib.sha1(url.encode('utf-8')).hexdigest()[:20]
    return os.path.join(CACHE_DIR, host, digest + '.json')


def fetch_json(url, accept='application/json'):
    """GET url and parse JSON, using the on-disk cache first.

    Raises SourceError when the source is unreachable so callers can degrade.
    """
    path = _cache_path(url)
    if os.path.exists(path):
        with open(path, encoding='utf-8') as fh:
            return json.load(fh)['body']
    if OFFLINE:
        raise SourceError('offline and not cached: ' + url[:120])
    host = urllib.parse.urlparse(url).netloc
    wait = THROTTLE.get(host, 0.5) - (time.time() - _last_hit.get(host, 0))
    if wait > 0:
        time.sleep(wait)
    last_error = None
    for attempt in range(5):
        _last_hit[host] = time.time()
        try:
            req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': accept})
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = json.loads(resp.read().decode('utf-8'))
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8') as fh:
                json.dump({'url': url, 'fetchedAt': GENERATED_ON, 'body': body}, fh, ensure_ascii=False)
            return body
        except urllib.error.HTTPError as err:
            last_error = err
            if err.code == 404:
                # Cache negative answers too (e.g. pageviews for a brand-new article).
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, 'w', encoding='utf-8') as fh:
                    json.dump({'url': url, 'fetchedAt': GENERATED_ON, 'body': None, 'status': 404}, fh)
                return None
            if err.code in (429, 500, 502, 503, 504):
                retry_after = err.headers.get('Retry-After') if err.headers else None
                delay = float(retry_after) if retry_after and retry_after.isdigit() else 2 ** (attempt + 1)
                time.sleep(min(delay, 30))
                continue
            break
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as err:
            last_error = err
            time.sleep(2 ** attempt)
    raise SourceError(f'{host}: {last_error}')


def sparql(query):
    url = 'https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': query, 'format': 'json'})
    body = fetch_json(url, accept='application/sparql-results+json')
    rows = []
    for binding in (body or {}).get('results', {}).get('bindings', []):
        rows.append({k: v.get('value') for k, v in binding.items()})
    return rows


def wikivoyage(params):
    base = {'format': 'json', 'formatversion': 2, 'redirects': 1}
    base.update(params)
    return fetch_json('https://en.wikivoyage.org/w/api.php?' + urllib.parse.urlencode(base))


# --------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------

def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:40] or 'item'


def norm_name(text):
    text = unicodedata.normalize('NFKD', text or '').encode('ascii', 'ignore').decode('ascii').lower()
    text = re.sub(r'\(.*?\)', ' ', text)
    text = re.sub(r'\b(the|of|and|de|del|la|el|le|di)\b', ' ', text)
    return re.sub(r'[^a-z0-9]+', ' ', text).strip()


def haversine_km(a_lat, a_lon, b_lat, b_lon):
    r = 6371.0
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp, dl = p2 - p1, math.radians(b_lon - a_lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def parse_point(wkt):
    m = re.match(r'Point\(([-\d.eE]+) ([-\d.eE]+)\)', wkt or '')
    return (float(m.group(2)), float(m.group(1))) if m else (None, None)


def nice_round(value):
    """Round a money amount to a friendly figure in any currency."""
    if value <= 0:
        return 0
    exp = math.floor(math.log10(value))
    step = max(1, 10 ** (exp - 1) * (5 if value >= 10 ** exp * 2 else 2))
    return int(round(value / step) * step) or step


def clean_wikitext(text):
    text = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', text or '')
    text = re.sub(r'\{\{[^{}]*\}\}', '', text)
    text = re.sub(r"'{2,}", '', text)
    text = re.sub(r'<[^>]+>', '', text)
    return re.sub(r'\s+', ' ', text).strip()


# --------------------------------------------------------------------------
# Wikivoyage parsing
# --------------------------------------------------------------------------

LISTING_RE = re.compile(r'\{\{\s*(see|do|eat|drink|buy|sleep|go|listing|marker)\s*\|', re.I)


def _split_params(body):
    parts, depth_curly, depth_square, buf = [], 0, 0, []
    i = 0
    while i < len(body):
        two = body[i:i + 2]
        if two == '{{':
            depth_curly += 1; buf.append(two); i += 2; continue
        if two == '}}':
            depth_curly -= 1; buf.append(two); i += 2; continue
        if two == '[[':
            depth_square += 1; buf.append(two); i += 2; continue
        if two == ']]':
            depth_square -= 1; buf.append(two); i += 2; continue
        ch = body[i]
        if ch == '|' and depth_curly == 0 and depth_square == 0:
            parts.append(''.join(buf)); buf = []
        else:
            buf.append(ch)
        i += 1
    parts.append(''.join(buf))
    params = {}
    for part in parts:
        if '=' in part:
            key, value = part.split('=', 1)
            params[key.strip().lower()] = value.strip()
    return params


def sections_of(wikitext):
    """Yield (top-level section name, start, end) for == Level 2 == headings."""
    heads = [(m.start(), m.end(), m.group(1).strip()) for m in re.finditer(r'^==([^=].*?)==\s*$', wikitext, re.M)]
    out = []
    for idx, (start, end, name) in enumerate(heads):
        stop = heads[idx + 1][0] if idx + 1 < len(heads) else len(wikitext)
        out.append((name, end, stop))
    return out


def parse_listings(wikitext, district=None):
    """Return listing dicts from see/do/listing/marker templates with their section."""
    secs = sections_of(wikitext)

    def section_at(pos):
        for name, start, stop in secs:
            if start <= pos < stop:
                return name
        return ''

    listings = []
    for m in LISTING_RE.finditer(wikitext):
        start, depth, i = m.start(), 0, m.start()
        while i < len(wikitext) - 1:
            if wikitext[i:i + 2] == '{{':
                depth += 1; i += 2; continue
            if wikitext[i:i + 2] == '}}':
                depth -= 1; i += 2
                if depth == 0:
                    break
                continue
            i += 1
        body = wikitext[m.end():i - 2]
        params = _split_params(body)
        kind = m.group(1).lower()
        if kind in ('listing', 'marker'):
            kind = (params.get('type') or '').lower() or 'listing'
        name = clean_wikitext(params.get('name', ''))
        if not name:
            continue
        def num(key):
            try:
                return float(params.get(key, ''))
            except ValueError:
                return None
        qid = params.get('wikidata', '').strip()
        listings.append({
            'kind': kind,
            'section': section_at(start),
            'name': name,
            'qid': qid if re.fullmatch(r'Q\d+', qid) else None,
            'lat': num('lat'),
            'lon': num('long'),
            'url': params.get('url', '').strip(),
            'content': clean_wikitext(params.get('content', ''))[:400],
            'price': clean_wikitext(params.get('price', ''))[:120],
            'district': district,
            'order': len(listings),
        })
    return listings


def section_text(wikitext, name):
    for sec_name, start, stop in sections_of(wikitext):
        if sec_name.lower() == name.lower():
            return wikitext[start:stop]
    return ''


def resolve_wikivoyage(city, country_name=None):
    """Find the Wikivoyage article for a city. Returns (title, wikitext, qid)."""
    candidates = [city]
    if country_name:
        candidates.insert(0, f'{city} ({country_name})')
    for title in candidates:
        body = wikivoyage({'action': 'query', 'prop': 'pageprops', 'titles': title, 'ppprop': 'wikibase_item|disambiguation'})
        pages = (body or {}).get('query', {}).get('pages', [])
        if not pages or pages[0].get('missing'):
            continue
        props = pages[0].get('pageprops', {})
        if 'disambiguation' in props:
            continue
        real_title = pages[0]['title']
        parsed = wikivoyage({'action': 'parse', 'page': real_title, 'prop': 'wikitext'})
        text = (parsed or {}).get('parse', {}).get('wikitext', '')
        if text:
            return real_title, text, props.get('wikibase_item')
    return None, '', None


def fetch_district_pages(title, wikitext, limit):
    districts = section_text(wikitext, 'Districts')
    seen, out = set(), []
    for target in re.findall(r'\[\[(' + re.escape(title) + r'/[^\]|#]+)', districts):
        target = target.strip().replace('_', ' ')
        if target in seen:
            continue
        seen.add(target)
        out.append(target)
    pages = []
    for target in out[:limit]:
        parsed = wikivoyage({'action': 'parse', 'page': target, 'prop': 'wikitext'})
        text = (parsed or {}).get('parse', {}).get('wikitext', '')
        if text:
            pages.append((target.split('/', 1)[1], text))
    return pages


# --------------------------------------------------------------------------
# Wikidata
# --------------------------------------------------------------------------

def city_facts(qid):
    rows = sparql(f"""
SELECT ?label ?coord ?pop ?iso ?countryLabel ?cur ?site WHERE {{
  wd:{qid} wdt:P625 ?coord .
  OPTIONAL {{ wd:{qid} rdfs:label ?label . FILTER(LANG(?label) = "en") }}
  OPTIONAL {{ wd:{qid} wdt:P1082 ?pop }}
  OPTIONAL {{ wd:{qid} wdt:P856 ?site }}
  OPTIONAL {{ wd:{qid} wdt:P17 ?country . ?country wdt:P297 ?iso .
             ?country rdfs:label ?countryLabel . FILTER(LANG(?countryLabel) = "en")
             OPTIONAL {{ ?country wdt:P38 ?c . ?c wdt:P498 ?cur }} }}
}}""")
    if not rows:
        raise SourceError('wikidata: no facts for ' + qid)
    lat, lon = parse_point(rows[0]['coord'])
    pops = [float(r['pop']) for r in rows if r.get('pop')]
    curs = sorted({r['cur'] for r in rows if r.get('cur')})
    return {
        'qid': qid,
        'label': rows[0].get('label'),
        'lat': lat, 'lon': lon,
        'population': max(pops) if pops else None,
        'countryCode': rows[0].get('iso'),
        'country': rows[0].get('countryLabel'),
        'currencies': curs,
        'officialSite': next((r['site'] for r in rows if r.get('site')), None),
    }


def country_by_code(cc):
    """Country name + currency for an ISO code (used when the city's P17 is e.g.
    'Kingdom of the Netherlands', which has no ISO 3166-1 code of its own)."""
    rows = sparql(f"""
SELECT ?label ?cur WHERE {{
  ?country wdt:P297 "{cc}" ; rdfs:label ?label . FILTER(LANG(?label) = "en")
  OPTIONAL {{ ?country wdt:P38 ?c . ?c wdt:P498 ?cur }}
}}""")
    return (rows[0]['label'] if rows else None), sorted({r['cur'] for r in rows if r.get('cur')})


def find_city_qid(city, country_code=None):
    """Fallback when Wikivoyage is unavailable: best-linked settlement with that label."""
    country_filter = f'?country wdt:P297 "{country_code}" .' if country_code else ''
    rows = sparql(f"""
SELECT ?city ?sl WHERE {{
  ?city rdfs:label "{city}"@en ; wdt:P31/wdt:P279* wd:Q486972 ; wikibase:sitelinks ?sl ; wdt:P17 ?country .
  {country_filter}
}} ORDER BY DESC(?sl) LIMIT 1""")
    return rows[0]['city'].rsplit('/', 1)[1] if rows else None


def nearby_items(lat, lon, radius_km, min_sitelinks=8, limit=400):
    rows = sparql(f"""
SELECT ?item ?sl ?loc WHERE {{
  SERVICE wikibase:around {{ ?item wdt:P625 ?loc . bd:serviceParam wikibase:center "Point({lon} {lat})"^^geo:wktLiteral . bd:serviceParam wikibase:radius "{radius_km}" . }}
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= {min_sitelinks})
}} ORDER BY DESC(?sl) LIMIT {limit}""")
    out = {}
    for r in rows:
        q = r['item'].rsplit('/', 1)[1]
        la, lo = parse_point(r['loc'])
        out[q] = {'qid': q, 'sitelinks': int(r['sl']), 'lat': la, 'lon': lo}
    return out


def item_details(qids):
    details = {}
    qids = sorted(set(qids))
    for i in range(0, len(qids), 80):
        chunk = qids[i:i + 80]
        rows = sparql("""
SELECT ?item ?label ?sl ?loc ?wp ?heritage
  (GROUP_CONCAT(DISTINCT ?clL; separator="|") AS ?classes)
  (GROUP_CONCAT(DISTINCT ?aL; separator="|") AS ?areas) WHERE {
  VALUES ?item { %s }
  ?item wikibase:sitelinks ?sl .
  OPTIONAL { ?item rdfs:label ?label . FILTER(LANG(?label) = "en") }
  OPTIONAL { ?item wdt:P625 ?loc }
  OPTIONAL { ?item wdt:P31 ?cl . ?cl rdfs:label ?clL . FILTER(LANG(?clL) = "en") }
  OPTIONAL { ?item wdt:P131 ?a . ?a rdfs:label ?aL . FILTER(LANG(?aL) = "en") }
  OPTIONAL { ?item wdt:P1435 ?heritage }
  OPTIONAL { ?wp schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }
} GROUP BY ?item ?label ?sl ?loc ?wp ?heritage""" % ' '.join('wd:' + q for q in chunk))
        for r in rows:
            q = r['item'].rsplit('/', 1)[1]
            if q in details:
                if r.get('heritage'):
                    details[q]['heritage'] = True
                continue
            la, lo = parse_point(r.get('loc'))
            wp = r.get('wp')
            details[q] = {
                'qid': q,
                'label': r.get('label'),
                'sitelinks': int(r.get('sl') or 0),
                'lat': la, 'lon': lo,
                'classes': [c for c in (r.get('classes') or '').split('|') if c],
                'areas': [a for a in (r.get('areas') or '').split('|') if a],
                'heritage': bool(r.get('heritage')),
                'enwiki': urllib.parse.unquote(wp.rsplit('/', 1)[1]) if wp else None,
            }
    return details


def pageviews(enwiki_title):
    if not enwiki_title:
        return 0
    title = urllib.parse.quote(enwiki_title.replace(' ', '_'), safe='')
    url = ('https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/'
           f'{title}/monthly/{PAGEVIEW_WINDOW[0]}/{PAGEVIEW_WINDOW[1]}')
    body = fetch_json(url)
    return sum(item.get('views', 0) for item in (body or {}).get('items', []))


# --------------------------------------------------------------------------
# Price level (World Bank) and time zone (tz database)
# --------------------------------------------------------------------------

def price_level(country_code):
    """Local currency units per international dollar of household consumption."""
    for indicator in ('PA.NUS.PRVT.PP', 'PA.NUS.PPP'):
        url = f'https://api.worldbank.org/v2/country/{country_code}/indicator/{indicator}?format=json&mrnev=1&per_page=5'
        body = fetch_json(url)
        if isinstance(body, list) and len(body) > 1 and body[1]:
            row = body[1][0]
            if row.get('value'):
                return {'ppp': float(row['value']), 'indicator': indicator, 'year': row.get('date')}
    raise SourceError('worldbank: no PPP for ' + country_code)


def market_fx(country_code):
    """Official LCU per USD, used only to report price level vs the US (PLI)."""
    url = f'https://api.worldbank.org/v2/country/{country_code}/indicator/PA.NUS.FCRF?format=json&mrnev=1&per_page=5'
    body = fetch_json(url)
    if isinstance(body, list) and len(body) > 1 and body[1] and body[1][0].get('value'):
        return float(body[1][0]['value'])
    return None


def _tz_coord(text):
    m = re.match(r'([+-])(\d{2})(\d{2})(\d{2})?([+-])(\d{3})(\d{2})(\d{2})?$', text)
    if not m:
        return None, None
    lat = int(m.group(2)) + int(m.group(3)) / 60 + int(m.group(4) or 0) / 3600
    lon = int(m.group(6)) + int(m.group(7)) / 60 + int(m.group(8) or 0) / 3600
    return (lat if m.group(1) == '+' else -lat), (lon if m.group(5) == '+' else -lon)


def time_zone(country_code, lat, lon):
    """Nearest tz database zone (by principal city) among zones for this country."""
    best = None
    # zone.tab keeps one row per country (Europe/Amsterdam, Asia/Kuala_Lumpur); zone1970.tab
    # merges countries that share clocks since 1970 (NL -> Europe/Brussels), so it is the fallback.
    for path in ('/usr/share/zoneinfo/zone.tab', '/usr/share/zoneinfo/zone1970.tab'):
        if not os.path.exists(path):
            continue
        with open(path, encoding='utf-8') as fh:
            for line in fh:
                if line.startswith('#') or not line.strip():
                    continue
                cols = line.rstrip('\n').split('\t')
                if country_code not in cols[0].split(','):
                    continue
                z_lat, z_lon = _tz_coord(cols[1])
                if z_lat is None:
                    continue
                d = haversine_km(lat, lon, z_lat, z_lon)
                if best is None or d < best[0]:
                    best = (d, cols[2])
        if best:
            return best[1]
    return None


# --------------------------------------------------------------------------
# Classification: Wikidata classes / Wikivoyage section -> our vocabulary
# --------------------------------------------------------------------------

# category: (tags, durationMinutes, base cost in international dollars, famous premium applies)
CATEGORIES = {
    'theme_park': (['adventure'], 210, 75, False),
    'water_park': (['adventure', 'beach'], 210, 45, False),
    'zoo': (['nature', 'adventure'], 180, 30, False),
    'national_park': (['nature', 'adventure'], 210, 15, False),
    'beach': (['beach', 'nature'], 180, 8, False),
    'art_museum': (['art', 'culture'], 150, 20, True),
    'museum': (['culture'], 150, 18, True),
    'palace': (['culture', 'art'], 150, 20, True),
    'archaeological': (['culture'], 180, 12, True),
    'cathedral': (['culture'], 90, 8, True),
    'religious': (['culture'], 60, 0, False),
    'viewpoint': (['nature'], 120, 10, False),
    'tower': (['culture'], 90, 25, True),
    'square': (['culture'], 60, 0, False),
    'street': (['culture', 'shopping'], 90, 0, False),
    'eatery': (['food'], 90, 30, False),
    'park': (['nature'], 120, 0, False),
    'garden': (['nature'], 120, 8, False),
    'lake': (['nature'], 120, 12, False),
    'water': (['nature'], 120, 20, False),
    'mountain': (['nature', 'adventure'], 180, 10, False),
    'market': (['food', 'shopping'], 120, 20, False),
    'shopping': (['shopping'], 150, 0, False),
    'casino': (['nightlife'], 180, 40, False),
    'show': (['nightlife', 'art'], 150, 55, False),
    'stadium': (['culture', 'adventure'], 90, 30, True),
    'neighbourhood': (['culture', 'food'], 150, 10, False),
    'monument': (['culture'], 60, 0, False),
    'landmark': (['culture'], 60, 10, True),
    'activity': (['adventure'], 180, 40, False),
    'tour': (['culture'], 150, 35, False),
    'daytrip': (['culture', 'nature'], 210, 15, False),
}

# Ordered: first match wins. Keywords match English class labels from Wikidata
# (instance of) or, for listings without a QID, the listing name/description.
CLASS_RULES = [
    ('theme_park', ['amusement park', 'theme park']),
    ('water_park', ['water park']),
    ('zoo', ['zoo', 'aquarium', 'safari park', 'wildlife']),
    ('national_park', ['national park', 'nature reserve', 'wildlife sanctuary', 'protected area', 'tiger reserve']),
    ('beach', ['beach']),
    ('casino', ['casino', 'resort hotel', 'entertainment district']),
    ('art_museum', ['art museum', 'art gallery', 'gallery', 'contemporary art']),
    ('museum', ['museum', 'science centre', 'science center', 'planetarium', 'exhibition']),
    ('palace', ['palace', 'castle', 'fort', 'fortress', 'citadel', 'stately home', 'royal residence', 'haveli', 'chateau', 'manor']),
    ('archaeological', ['archaeological', 'ruins', 'ancient city', 'world heritage', 'necropolis', 'step well', 'stepwell']),
    ('cathedral', ['cathedral', 'basilica', 'expiatory', 'abbey']),
    ('religious', ['church', 'temple', 'mosque', 'synagogue', 'shrine', 'monastery', 'gurdwara', 'ashram', 'stupa', 'pagoda', 'chapel', 'ghat', 'convent', 'mandir', 'dargah']),
    ('tower', ['observation deck', 'observation tower', 'television tower', 'tower', 'ferris wheel', 'skyscraper', 'bridge', 'cable car', 'aerial tramway']),
    ('viewpoint', ['viewpoint', 'lookout', 'scenic', 'sunset point']),
    ('square', ['square', 'plaza', 'piazza', 'maidan']),
    ('garden', ['botanical garden', 'garden']),
    ('park', ['park', 'urban park', 'promenade', 'pier', 'boardwalk', 'waterfront']),
    ('lake', ['lake', 'reservoir', 'lagoon', 'waterfall']),
    ('mountain', ['mountain', 'hill', 'peak', 'cave', 'canyon', 'valley', 'island', 'volcano', 'forest', 'desert']),
    ('market', ['market', 'bazaar', 'food hall', 'food court', 'night market']),
    ('eatery', ['restaurant', 'brewery', 'cafe', 'café', 'coffeehouse', 'pub', 'cocktail bar', 'wine bar', 'beer bar',
                'winery', 'distillery', 'street food', 'food street', 'hawker centre', 'hawker center']),
    ('shopping', ['shopping', 'mall', 'department store', 'shopping street', 'shopping district', 'arcade', 'outlet']),
    ('street', ['street', 'avenue', 'boulevard', 'rambla', 'pedestrian zone', 'lane']),
    ('show', ['theatre', 'theater', 'opera', 'concert hall', 'music venue', 'performing arts', 'show', 'cabaret', 'nightclub', 'jazz']),
    ('stadium', ['stadium', 'arena', 'football venue', 'sports venue', 'cricket ground']),
    ('water', ['river', 'canal', 'ria', 'estuary', 'bay', 'strait', 'inlet', 'harbour', 'harbor']),
    ('neighbourhood', ['old town', 'historic district', 'historic centre', 'historic center', 'neighborhood', 'neighbourhood', 'quarter', 'chinatown', 'tourist destination', 'cultural district']),
    ('monument', ['monument', 'memorial', 'statue', 'sculpture', 'arch', 'gate', 'fountain', 'obelisk', 'column', 'mausoleum', 'tomb', 'clock tower', 'landmark', 'tourist attraction']),
    ('activity', ['rafting', 'paragliding', 'trek', 'hike', 'hiking', 'yoga', 'diving', 'snorkel', 'kayak', 'surf', 'cycling', 'bike', 'climb', 'zip', 'bungee', 'safari', 'cruise', 'boat']),
    ('tour', ['tour', 'walk', 'heritage walk']),
]

# Never a visitor activity, whatever other classes say (people, events, works, defunct places).
ABSOLUTE_EXCLUDE = ['human', 'fictional', 'sports event', 'sporting event', 'event edition', 'recurring event',
                    'season', 'olympic', 'championship', 'grand prix', 'tournament', 'battle', 'sports team',
                    'football team', 'basketball team', 'baseball team', 'hockey team', 'cricket team', 'rugby team',
                    'soccer team', 'esports team',
                    'film', 'album', 'single', 'musical work', 'concert tour', 'tour', 'festival', 'fair', 'parade',
                    'election', 'disease', 'destroyed', 'demolished', 'accident', 'disaster', 'incident',
                    'attack', 'crash', 'index', 'stock exchange', 'given name', 'family name', 'disambiguation',
                    'painting', 'literary', 'television', 'video game', 'street circuit', 'race track', 'motorsport']
# Not a visitor activity unless another class is a strong visitor category (e.g. the British
# Museum is also a "charitable organization").
ALWAYS_EXCLUDE = ['organization', 'organisation', 'company', 'business', 'club', 'publisher', 'political party',
                  'rapid transit', 'railway line', 'metro line', 'bus line', 'tram line', 'musical ensemble',
                  'orchestra', 'agency', 'legislature', 'government', 'council', 'parliament', 'magazine',
                  'newspaper', 'radio station', 'airline', 'hotel chain', 'restaurant chain', 'diocese',
                  'religious order', 'university', 'educational institution', 'airbase', 'air force',
                  'military base', 'naval base', 'market town', 'area of', 'convention center', 'convention centre',
                  'exhibition center', 'exhibition centre', 'public body', 'former']
STRONG = ('museum', 'art_museum', 'palace', 'archaeological', 'zoo', 'theme_park', 'water_park', 'cathedral',
          'religious', 'casino', 'national_park', 'garden', 'beach', 'market', 'show', 'park', 'water', 'mountain')
# Excluded unless heritage-designated or another class is a clear visitor category.
SOFT_EXCLUDE = ['municipality', 'city', 'town', 'human settlement', 'province', 'county', 'district of', 'comarca',
                'borough', 'ward', 'state of', 'region', 'metropolitan area', 'capital', 'college',
                'school', 'hospital', 'railway station', 'metro station', 'station', 'airport', 'port', 'seaport',
                'office building', 'headquarters', 'residential', 'apartment', 'hotel', 'library', 'embassy',
                'consulate', 'court', 'prison', 'highway', 'motorway', 'road', 'expressway', 'interchange',
                'watercourse', 'dam', 'power station', 'cemetery', 'research', 'institute', 'military', 'barracks',
                'commercial building', 'building', 'house', 'lighthouse', 'tunnel', 'campus',
                'transport hub', 'neighborhood of', 'census-designated place', 'unincorporated', 'tower block']


def _has(text, keywords):
    text = text.lower().replace('old town', 'old_town')
    return any(re.search(r'(?<![a-z])' + re.escape(k) + r'(?![a-z])', text) for k in keywords)


def classify(texts):
    blob = ' | '.join(t.lower() for t in texts if t)
    for category, keywords in CLASS_RULES:
        for kw in keywords:
            if re.search(r'(?<![a-z])' + re.escape(kw) + r'(?:s|es)?(?![a-z])', blob):
                return category
    return None


def excluded(classes, curated, heritage):
    """Per-class test. Curated (Wikivoyage) items obey the same rules; curation
    only rescues items whose classes are all unknown (handled by the caller)."""
    if any(_has(c, ABSOLUTE_EXCLUDE) for c in classes):
        return True
    strong = [c for c in classes if classify([c]) in STRONG and not _has(c, ALWAYS_EXCLUDE + SOFT_EXCLUDE)]
    if any(_has(c, ALWAYS_EXCLUDE) for c in classes) and not strong:
        return True
    if heritage:
        return False
    soft = [c for c in classes if _has(c, SOFT_EXCLUDE)]
    if not soft:
        return False
    if any(classify([c]) in STRONG and classify([c]) != 'archaeological' for c in soft):
        return False  # e.g. "historic house museum" is a house *and* a museum
    # Rescue when some *other* class is a clear visitor category (e.g. "historic house museum").
    clean = [c for c in classes if c not in soft]
    rescued = classify(clean)
    return rescued is None or rescued in ('monument', 'landmark', 'square', 'street', 'shopping', 'tower', 'neighbourhood')


def penalty(c):
    """Popularity is not suitability: stadiums and office towers get lots of
    pageviews for non-visitor reasons; heritage-listed stations etc. are niche."""
    p = 0.0
    if c['category'] == 'stadium':
        p += 0.8 if c['curated'] else 1.2
    if any(_has(k, ['skyscraper', 'tower block']) for k in c['classes']) and not c['curated']:
        p += 0.6
    if any(_has(k, SOFT_EXCLUDE) for k in c['classes']):
        p += 0.8
    if c.get('distance_km', 0) > 4:
        p += 0.06 * (c['distance_km'] - 4)
    return p


# Diversity caps so a city is not 9 churches.
CAPS = {'religious': 3, 'cathedral': 2, 'museum': 3, 'art_museum': 2, 'stadium': 1, 'neighbourhood': 2,
        'monument': 2, 'park': 2, 'garden': 1, 'viewpoint': 2, 'casino': 3, 'market': 2, 'shopping': 2,
        'beach': 2, 'show': 1, 'landmark': 3, 'lake': 2, 'mountain': 2, 'palace': 3, 'tower': 1, 'square': 1,
        'eatery': 1, 'street': 2, 'daytrip': 1}


# --------------------------------------------------------------------------
# Pack assembly
# --------------------------------------------------------------------------

def city_multiplier(population):
    """Big, in-demand cities cost more than the national average price level."""
    if not population:
        return 1.0
    if population >= 5_000_000:
        return 1.2
    if population >= 1_000_000:
        return 1.1
    if population >= 250_000:
        return 1.0
    return 0.95


def search_radius(population):
    if population and population >= 3_000_000:
        return 14
    if population and population >= 600_000:
        return 10
    return 12  # small towns: sights (Auroville, Neelkanth) are often outside the centre


def min_sitelinks(population):
    return 8 if population and population >= 600_000 else 3


def strip_place_suffix(name, city_name, country_name):
    """'Vitthala Temple, Hampi' -> 'Vitthala Temple' (but keep 'Mary, Mother of Jesus Mosque')."""
    m = re.match(r'^(.*?),\s+([^,]+)$', name)
    if m:
        tail = norm_name(m.group(2))
        places = {norm_name(city_name), norm_name(country_name or '')}
        if tail in places or any(p and (p in tail or (len(tail) >= 4 and tail in p)) for p in places):
            return m.group(1)
    return name


def display_name(detail, listing, city_name='', country_name=''):
    def strip(text):
        text = strip_place_suffix(text, city_name, country_name)
        for area in (detail or {}).get('areas', []):
            text = strip_place_suffix(text, area, None)
        return text
    if detail and detail.get('label'):
        detail = dict(detail, label=strip(detail['label']))
    if detail and detail.get('enwiki'):
        name = re.sub(r'\s*\(.*?\)\s*$', '', detail['enwiki'].replace('_', ' '))
        name = strip(name)
        label_tokens = set(norm_name(detail.get('label')).split())
        # Some items link to a broader article (e.g. a church item whose enwiki is "Mary").
        if len(name) <= 48 and (not label_tokens or label_tokens & set(norm_name(name).split())):
            return name
    if listing and listing.get('name') and len(listing['name']) <= 48:
        return listing['name']
    if detail and detail.get('label'):
        return detail['label']
    return (listing or {}).get('name', 'Sight')


def pick_area(detail, listing, city_name, country_name, alias=''):
    if listing and listing.get('district'):
        return listing['district']
    bad = {norm_name(city_name), norm_name(country_name or ''), norm_name(alias)}
    for area in (detail or {}).get('areas', []):
        if norm_name(area) in bad or re.search(r'province|county|state|region|comarca|district$|municipality|prefecture|governorate', area.lower()):
            continue
        return area
    return city_name


def build_candidates(ctx):
    """Merge curated Wikivoyage listings with nearby Wikidata items."""
    listings = ctx['listings']
    by_qid = {}
    listings = [li for li in listings if li['kind'] in ('see', 'do') and li['section'].lower() in ('see', 'do', '')]
    for li in listings:
        if li['qid']:
            by_qid.setdefault(li['qid'], li)
    near = ctx['nearby']
    qids = set(by_qid) | set(near)
    qids.discard(ctx['city']['qid'])
    details = item_details(qids) if qids else {}
    ctx['sources_used'].add('wikidata')

    display_city = ctx['city']['label'] or ctx['city_name']
    go_next = {norm_name(t.split('/')[-1]) for t in re.findall(r'\[\[([^\]|#]+)', section_text(ctx['wikitext'], 'Go next'))}
    highlight_text = norm_name(clean_wikitext(section_text(ctx['wikitext'], 'See') + ' ' + section_text(ctx['wikitext'], 'Do')))
    candidates = []
    c_lat, c_lon = ctx['city']['lat'], ctx['city']['lon']
    max_km = ctx['radius'] * 2.2
    for q in qids:
        d = details.get(q)
        if not d:
            continue
        li = by_qid.get(q)
        lat = d['lat'] if d['lat'] is not None else (li or {}).get('lat')
        lon = d['lon'] if d['lon'] is not None else (li or {}).get('lon')
        if lat is None or lon is None:
            continue
        dist = haversine_km(c_lat, c_lon, lat, lon)
        if dist > max_km:
            continue
        curated = li is not None
        label_key = norm_name(strip_place_suffix(d.get('label') or '', display_city, ctx['city']['country']))
        if label_key and label_key in go_next and dist >= 3 and not any(_has(c, ABSOLUTE_EXCLUDE) for c in d['classes']):
            category = 'daytrip'  # a nearby town Wikivoyage itself recommends under "Go next"
        elif excluded(d['classes'], curated, d['heritage']):
            continue
        else:
            category = classify(d['classes'])
        if category is None and li:
            # Listing prose is too noisy to classify ("near the pier", "a bar nearby"); use the name only.
            category = classify([li['name']]) or ('activity' if li['kind'] == 'do' else 'landmark')
        if category is None and d['heritage']:
            category = 'landmark'
        if category is None:
            continue
        if category == 'water' and d['sitelinks'] < 25 and not curated:
            continue  # minor streams are not boat trips
        name = display_name(d, li, ctx['city_name'], ctx['city']['country'])
        if len(name.split()) == 1 and d['sitelinks'] < 10 and not curated:
            continue  # obscure one-word items are usually mis-geocoded or ambiguous
        candidates.append({
            'qid': q, 'name': name, 'category': category, 'lat': lat, 'lon': lon,
            'sitelinks': d['sitelinks'], 'enwiki': d['enwiki'], 'curated': curated,
            'heritage': d['heritage'], 'highlight': norm_name(name) in highlight_text and len(norm_name(name)) > 4,
            'area': display_city if category == 'water' else pick_area(d, li, display_city, ctx['city']['country'], ctx['city_name']),
            'classes': d['classes'][:6], 'distance_km': round(dist, 1),
        })

    # Listings without a QID: useful for small towns where Wikidata is thin.
    for li in listings:
        if li['qid']:
            continue
        if re.search(r'\b(ltd|pvt|inc|llc|agency|travels?|tours|institute|school|academy|centre|center|shop|store|'
                     r'rentals?|hire|clinic|astrology|palmistry|healing|reiki|wellness|ayurved\w*|retreat|festival|'
                     r'mela|fair|massage|spa|guide|guides|company|co|vibes|studio|classes|course|adventures|divers|diving)\b',
                     li['name'].lower()):
            continue  # businesses and courses, not sights
        category = classify([li['name']])
        if category is None:
            if li['kind'] == 'do':
                continue  # an unclassifiable "Do" listing is usually a business
            category = 'landmark'
        candidates.append({
            'qid': None, 'name': li['name'][:48], 'category': category,
            'lat': li['lat'] if li['lat'] is not None else c_lat, 'lon': li['lon'] if li['lon'] is not None else c_lon,
            'has_coords': li['lat'] is not None,
            'sitelinks': 0, 'enwiki': None, 'curated': True, 'heritage': False, 'highlight': False,
            'area': li['district'] or display_city, 'classes': [], 'order': li['order'],
        })
    return candidates


def score_candidates(candidates):
    for c in candidates:
        c['pageviews'] = 0
    ranked = sorted(candidates, key=lambda c: (not c['curated'], -c['sitelinks']))
    curated = [c for c in ranked if c['curated'] and c['enwiki']][:40]
    popular = sorted([c for c in ranked if not c['curated'] and c['enwiki']], key=lambda c: -c['sitelinks'])[:30]
    for c in curated + popular:
        if c['enwiki']:
            try:
                c['pageviews'] = pageviews(c['enwiki'])
            except SourceError:
                c['pageviews'] = 0
    for c in candidates:
        s = math.log10(c['pageviews'] + 10) + 1.2 * math.log10(c['sitelinks'] + 1)
        s += 0.6 if c['curated'] else 0
        s += 0.5 if c['highlight'] else 0
        s += 0.2 if c['heritage'] else 0
        s -= penalty(c)
        if not c['qid']:
            # Uncurated-popularity listings: Wikivoyage order is the only signal.
            s = 1.6 - min(c.get('order', 0), 60) / 100
        c['score'] = round(s, 3)
    return sorted(candidates, key=lambda c: -c['score'])


GENERIC_TOKENS = {'temple', 'ashram', 'museum', 'beach', 'church', 'palace', 'park', 'garden', 'gardens', 'tower',
                  'mosque', 'square', 'street', 'river', 'lake', 'market', 'national', 'cathedral', 'basilica',
                  'bridge', 'island', 'house', 'gallery', 'centre', 'center', 'mandir', 'world', 'royal', 'saint',
                  'grand', 'great', 'central', 'state', 'city', 'old', 'new', 'hill', 'falls', 'stadium', 'arena'}


def _is_dup(c, chosen):
    key = norm_name(c['name'])
    for other in chosen:
        okey = norm_name(other['name'])
        if norm_name(c['name'].split(',')[0]) == norm_name(other['name'].split(',')[0]):
            return True
        if key == okey or (len(key) > 5 and (key in okey or okey in key)):
            return True
        if not (c.get('has_coords', True) and other.get('has_coords', True)):
            continue
        d = haversine_km(c['lat'], c['lon'], other['lat'], other['lon'])
        if d < 0.15 and c['category'] == other['category']:
            return True
        # "Alcatraz Island" vs "Alcatraz Federal Penitentiary": same place, two items.
        shared = {t for t in set(key.split()) & set(okey.split()) if len(t) >= 5 and t not in GENERIC_TOKENS}
        if d < 0.5 and shared:
            return True
    return False


def select(candidates, want):
    """Rank order with diversity caps; a second pass relaxes the caps for thin towns."""
    chosen, per_cat = [], {}
    for relaxed in (False, True):
        for c in candidates:
            if len(chosen) >= want:
                return chosen
            if c in chosen:
                continue
            if not relaxed and per_cat.get(c['category'], 0) >= CAPS.get(c['category'], 3):
                continue
            if relaxed and c['score'] < 1.0:
                continue
            if _is_dup(c, chosen):
                continue
            chosen.append(c)
            per_cat[c['category']] = per_cat.get(c['category'], 0) + 1
    return chosen


def to_activity(c, ppp):
    tags, duration, base_cost, premium = CATEGORIES[c['category']]
    cost = base_cost * ppp
    if premium and c['sitelinks'] >= 100:
        cost *= 2.2  # world-famous paid sights charge well above the local norm
    elif premium and c['sitelinks'] >= 60:
        cost *= 1.6
    if c['category'] == 'religious' and (c['heritage'] or c['sitelinks'] >= 25):
        duration = 90  # major temple/mosque complexes deserve more than a quick stop
    title = c['name']
    if c['category'] == 'water' and not re.search(r'cruise|boat|ferry', title, re.I):
        title = f'{title} boat cruise'
    if c['category'] == 'daytrip':
        title = f'Day trip to {title}'
    return {
        'id': slugify(title),
        'title': title,
        'tags': list(tags),
        'durationMinutes': duration,
        'location': c['area'],
        'costPerPerson': nice_round(cost),
        'lat': round(c['lat'], 5),
        'lon': round(c['lon'], 5),
        '_coords': c.get('has_coords', True),
        '_category': c['category'],
    }


def combine_short(activities, ranked):
    """Pair short sights (<= 90 min) with the nearest short sight within 2 km so each
    itinerary block is a sensible half day (engine schedules one block per day)."""
    out, used = [], set()
    for i, a in enumerate(activities):
        if i in used:
            continue
        if a['durationMinutes'] <= 90 and a.get('_coords', True) and a.get('_category') != 'stadium':
            best, best_d = None, 1.2
            for j in range(i + 1, len(activities)):
                b = activities[j]
                if j in used or b['durationMinutes'] > 120 or a['durationMinutes'] + b['durationMinutes'] + 30 > 210:
                    continue
                if not b.get('_coords', True) or b.get('_category') == 'stadium':
                    continue
                d = haversine_km(a['lat'], a['lon'], b['lat'], b['lon'])
                if d < best_d:
                    best, best_d = j, d
            if best is not None:
                b = activities[best]
                used.add(best)
                a = dict(a)
                a['id'] = (a['id'] + '-' + b['id'])[:60]
                a['title'] = f"{a['title']} and {b['title']}"
                a['tags'] = sorted(set(a['tags']) | set(b['tags']), key=TAGS.index)
                a['durationMinutes'] = min(210, a['durationMinutes'] + b['durationMinutes'] + 30)
                a['costPerPerson'] = nice_round(a['costPerPerson'] + b['costPerPerson']) if (a['costPerPerson'] + b['costPerPerson']) else 0
        used.add(i)
        out.append(a)
    return out


# Signature activities that Wikivoyage describes in prose (Do section) rather than as
# listings: (key, regex, title, tags, durationMinutes, base cost in international dollars).
PROSE_ACTIVITIES = [
    ('rafting', r'rafting', 'River rafting', ['adventure', 'nature'], 180, 35),
    ('paragliding', r'paraglid', 'Paragliding', ['adventure'], 120, 60),
    ('bungee', r'bungee', 'Bungee jumping', ['adventure'], 120, 70),
    ('yoga', r'\byoga\b', 'Yoga class', ['culture'], 90, 12),
    ('diving', r'scuba|\bdiving\b', 'Scuba diving trip', ['beach', 'adventure'], 210, 90),
    ('snorkelling', r'snorkel', 'Snorkelling trip', ['beach', 'adventure'], 180, 35),
    ('surfing', r'\bsurf(?:ing|ers?|board)?\b', 'Surf lesson', ['beach', 'adventure'], 150, 40),
    ('kayaking', r'kayak', 'Kayaking', ['nature', 'adventure'], 150, 30),
    ('cooking', r'cooking (?:class|course|school)', 'Cooking class', ['food', 'culture'], 180, 40),
    ('climbing', r'boulder|rock climbing|sport climbing', 'Bouldering and climbing', ['adventure', 'nature'], 180, 25),
    ('coracle', r'coracle', 'Coracle boat ride', ['nature'], 60, 6),
    ('balloon', r'hot.air balloon', 'Hot-air balloon ride', ['adventure', 'nature'], 180, 150),
    ('desert-safari', r'desert safari', 'Desert safari', ['adventure', 'nature'], 210, 60),
    ('trekking', r'\btrek(?:king|s)?\b|\bhiking\b', 'Guided trek', ['nature', 'adventure'], 210, 20),
    ('show', r'production show|cirque du soleil|broadway', 'Evening show', ['nightlife', 'art'], 150, 90),
]


def prose_activities(wikitext, city_label, ppp, small_town):
    do = section_text(wikitext, 'Do')
    if not do:
        return []
    headings = ' | '.join(re.findall(r'^===+\s*(.*?)\s*===+', do, re.M)).lower()
    found = []
    for order, (key, pattern, title, tags, duration, cost) in enumerate(PROSE_ACTIVITIES):
        mentions = len(re.findall(pattern, do, re.I))
        in_heading = bool(re.search(pattern, headings, re.I))
        if in_heading or mentions >= 3 or (small_town and mentions >= 1):
            found.append((-(mentions + (5 if in_heading else 0)), order, key, title, tags, duration, cost))
    found.sort()
    out = []
    for _, _, key, title, tags, duration, cost in found[:3 if small_town else 2]:
        out.append({
            'id': slugify(f'{key}-{city_label}'), 'title': f'{title} in {city_label}', 'tags': list(tags),
            'durationMinutes': duration, 'location': city_label, 'costPerPerson': nice_round(cost * ppp),
        })
    return out


def destination_tags(activities, wikitext, coastal):
    weight = {}
    for rank, a in enumerate(activities):
        for t in a['tags']:
            weight[t] = weight.get(t, 0) + (1.0 / (1 + rank * 0.15))
    drink = len(section_text(wikitext, 'Drink'))
    eat = len(section_text(wikitext, 'Eat'))
    if eat > 4000:
        weight['food'] = weight.get('food', 0) + 1.2
    if drink > 6000:
        weight['nightlife'] = weight.get('nightlife', 0) + 1.0
    if coastal:
        weight['beach'] = weight.get('beach', 0) + 0.5
    if any('food' in a['tags'] for a in activities[:10]):
        weight['food'] = max(weight.get('food', 0), 0.6)
    tags = [t for t, _ in sorted(weight.items(), key=lambda kv: -kv[1]) if weight[t] >= 0.6][:5]
    return sorted(tags, key=TAGS.index)


# Destination-side passport validity rules for foreign visitors (months beyond
# the trip end). Conservative defaults; visa keys are passport-dependent and are
# NOT derived here (see docs/places-pipeline.md).
SCHENGEN = {'AT', 'BE', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IT', 'LV', 'LI', 'LT',
            'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH'}
PASSPORT_MONTHS = {'GB': 0, 'IE': 0, 'US': 0, 'CA': 0, 'MX': 0, 'TR': 5, 'JP': 0, 'KR': 0, 'AU': 0, 'NZ': 1}


def passport_months(cc):
    if cc in SCHENGEN:
        return 3
    return PASSPORT_MONTHS.get(cc, 6)


def pick_currency(cc, codes):
    """Wikidata lists every currency used anywhere in a state (NL: EUR, USD, AWG...).
    ISO-4217 codes mostly start with the ISO-3166 code; the euro is the exception."""
    codes = sorted(set(codes))
    if len(codes) == 1:
        return codes[0]
    for code in codes:
        if code.startswith(cc):
            return code
    if 'EUR' in codes:
        return 'EUR'
    return codes[0] if codes else None


COUNTRY_NAMES = {'Kingdom of the Netherlands': 'Netherlands', "People's Republic of China": 'China',
                 'Kingdom of Denmark': 'Denmark', 'Republic of Ireland': 'Ireland'}


def tourist_office_url(listings):
    for li in listings:
        if li['url'] and re.search(r'tourist|visitor|tourism|visit |information cent', li['name'].lower()):
            return li['url']
    return None


def build_pack(city_name, country_code=None, pack_id=None, wikivoyage_title=None, want=12, district_limit=10):
    ctx = {'city_name': city_name, 'sources_used': set(), 'sources_failed': {}, 'listings': [], 'wikitext': ''}

    # 1. Wikivoyage article (+ QID)
    qid = None
    try:
        title, text, qid = resolve_wikivoyage(wikivoyage_title or city_name)
        if title:
            ctx['wikivoyage_title'] = title
            ctx['wikitext'] = text
            ctx['listings'] = parse_listings(text)
            if re.search(r'^==\s*Districts\s*==', text, re.M):
                for district, dtext in fetch_district_pages(title, text, district_limit):
                    ctx['listings'].extend(parse_listings(dtext, district=district))
            ctx['sources_used'].add('wikivoyage')
    except SourceError as err:
        ctx['sources_failed']['wikivoyage'] = str(err)

    # 2. City facts (Wikidata)
    if not qid:
        qid = find_city_qid(city_name, country_code)
    if not qid:
        raise SourceError(f'could not resolve a Wikidata item for {city_name!r}')
    city = city_facts(qid)
    if not city['countryCode'] and country_code:
        city['countryCode'] = country_code
        city['country'], city['currencies'] = country_by_code(country_code)
    if not city['countryCode']:
        raise SourceError(f'no ISO country code for {city_name!r}; pass --country')
    if country_code and city['countryCode'] and city['countryCode'] != country_code:
        raise SourceError(f'{city_name!r} resolved to {city["countryCode"]}, expected {country_code}; pass --wikivoyage-title')
    ctx['city'] = city
    cc = city['countryCode']

    # 3. Price level
    try:
        pl = price_level(cc)
        fx = market_fx(cc)
        ctx['sources_used'].add('worldbank')
    except SourceError as err:
        raise SourceError(f'no price level for {cc}: {err}')
    ppp = pl['ppp']
    mult = city_multiplier(city['population'])

    # 4. Attractions
    ctx['radius'] = search_radius(city['population'])
    try:
        ctx['nearby'] = nearby_items(city['lat'], city['lon'], ctx['radius'], min_sitelinks(city['population']))
    except SourceError as err:
        ctx['sources_failed']['wikidata-around'] = str(err)
        ctx['nearby'] = {}
    candidates = score_candidates(build_candidates(ctx))
    if any(c['pageviews'] for c in candidates):
        ctx['sources_used'].add('pageviews')
    chosen = select(candidates, want + 3)
    # Food is a core group interest: if no chosen sight covers it, promote the
    # best-ranked market/eatery among the top candidates into the 4th slot.
    if not any(c['category'] in ('market', 'eatery') for c in chosen) and chosen:
        floor = chosen[-1]['score'] - 1.5
        food = next((c for c in candidates[:80] if c['category'] in ('market', 'eatery') and c not in chosen
                     and c['score'] >= floor and not _is_dup(c, chosen)), None)
        if food:
            chosen.insert(min(3, len(chosen)), food)
    activities = combine_short([to_activity(c, ppp) for c in chosen], chosen)
    small_town = not city['population'] or city['population'] < 600_000
    for slot, extra in zip((2, 5, 8), prose_activities(ctx['wikitext'], city['label'] or city_name, ppp, small_town)):
        if not any(norm_name(extra['title'].split(' in ')[0]) in norm_name(a['title']) for a in activities):
            activities.insert(min(slot, len(activities)), extra)
            ctx.setdefault('prose', []).append(extra['title'])
    activities = activities[:want]
    if len(activities) < 4:
        raise SourceError(f'only {len(activities)} usable attractions for {city_name!r}')

    # Food is a core tag for groups; add a generic food walk when no sight covers it.
    if not any('food' in a['tags'] for a in activities):
        area = activities[0]['location']
        activities.insert(min(3, len(activities)), {
            'id': 'local-food-walk', 'title': f'{city["label"] or city_name} local food walk', 'tags': ['food', 'culture'],
            'durationMinutes': 150, 'location': area, 'costPerPerson': nice_round(25 * ppp),
            'lat': round(city['lat'], 5), 'lon': round(city['lon'], 5),
        })
        activities = activities[:want]

    # Make ids unique; drop internal fields
    seen = set()
    for a in activities:
        a.pop('_coords', None)
        a.pop('_category', None)
        base, n = a['id'], 2
        while a['id'] in seen:
            a['id'] = f'{base}-{n}'; n += 1
        seen.add(a['id'])

    coastal = any(c['category'] == 'beach' for c in candidates[:40])
    currency = pick_currency(cc, city['currencies'])
    dest_id = pack_id or slugify(city['label'] or city_name)
    sources = sorted(ctx['sources_used'])
    destination = {
        'id': dest_id,
        'name': city['label'] or city_name,
        'country': COUNTRY_NAMES.get(city['country'], city['country']),
        'countryCode': cc,
        'lat': round(city['lat'], 5),
        'lon': round(city['lon'], 5),
        'timeZone': time_zone(cc, city['lat'], city['lon']),
        'costCurrency': currency,
        'tags': destination_tags(activities, ctx['wikitext'], coastal),
        'passportMonths': passport_months(cc),
        'visaKey': None,
        'visaLeadDays': None,
        'visaWaivedBy': [],
        'officialUrl': tourist_office_url(ctx['listings']) or city['officialSite'] or
                       (f"https://en.wikivoyage.org/wiki/{urllib.parse.quote(ctx.get('wikivoyage_title', city_name).replace(' ', '_'))}"),
        'reviewedAt': GENERATED_ON,
        'roomCapacity': 2,
        'roomNight': nice_round(170 * ppp * mult),
        'vehicleCapacity': 4,
        'vehicleDay': nice_round(110 * ppp * mult),
        'foodDay': nice_round(55 * ppp * mult),
        'insurance': nice_round(25 * ppp),
        'entryAllowance': 0,
        'activities': activities,
        'source': f"pack:{'+'.join(s for s in sources if s in ('wikivoyage', 'wikidata'))} {PACK_MONTH}",
        'attribution': ('Places: Wikivoyage contributors (CC BY-SA 4.0) and Wikidata (CC0); popularity: Wikimedia pageviews; '
                        'price level: World Bank ICP (CC BY 4.0). Costs are estimates; verify before booking.'),
    }
    meta = {
        'generatedOn': GENERATED_ON,
        'generator': 'tools/places/city_pack.py',
        'input': {'city': city_name, 'country': country_code, 'wikivoyageTitle': ctx.get('wikivoyage_title')},
        'wikidata': qid,
        'wikivoyageUrl': (f"https://en.wikivoyage.org/wiki/{urllib.parse.quote(ctx['wikivoyage_title'].replace(' ', '_'))}"
                          if ctx.get('wikivoyage_title') else None),
        'population': city['population'],
        'priceLevel': {
            'indicator': pl['indicator'], 'year': pl['year'], 'lcuPerIntlDollar': round(ppp, 4),
            'lcuPerUsd': round(fx, 4) if fx else None,
            'priceLevelVsUS': round(ppp / fx, 3) if fx else None,
            'cityMultiplier': mult,
            'basisIntlDollars': {'roomNight': 170, 'vehicleDay': 110, 'foodDay': 55, 'insurance': 25},
        },
        'sources': sources,
        'sourcesFailed': ctx['sources_failed'],
        'candidates': len(candidates),
        'proseActivities': ctx.get('prose', []),
        'ranking': [
            {'title': c['name'], 'qid': c['qid'], 'category': c['category'], 'score': c['score'],
             'pageviews12m': c['pageviews'], 'sitelinks': c['sitelinks'], 'curated': c['curated']}
            for c in chosen
        ],
    }
    return {'destination': destination, 'meta': meta}


def write_pack(pack):
    os.makedirs(PACK_DIR, exist_ok=True)
    path = os.path.join(PACK_DIR, pack['destination']['id'] + '.json')
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(pack, fh, ensure_ascii=False, indent=2)
        fh.write('\n')
    return path


def summarize(pack):
    d = pack['destination']
    lines = [f"{d['id']}: {d['name']}, {d['country']} ({d['countryCode']}) tz={d['timeZone']} {d['costCurrency']} "
             f"room={d['roomNight']} food={d['foodDay']} vehicle={d['vehicleDay']} tags={d['tags']}"]
    for a in d['activities']:
        lines.append(f"   - {a['title']} [{','.join(a['tags'])}] {a['durationMinutes']}m @ {a['location']} {a['costPerPerson']} {d['costCurrency']}")
    return '\n'.join(lines)


def main(argv=None):
    global OFFLINE
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('city', nargs='?', help='City name, e.g. "Las Vegas"')
    ap.add_argument('--country', help='ISO-3166 alpha-2 code to check/disambiguate, e.g. US')
    ap.add_argument('--id', help='Destination id (default: slug of the city name)')
    ap.add_argument('--wikivoyage-title', help='Exact Wikivoyage article title if it differs from the city name')
    ap.add_argument('--max', type=int, default=12, help='Maximum activities (default 12)')
    ap.add_argument('--batch', action='store_true', help='Build every city listed in tools/places/cities.json')
    ap.add_argument('--offline', action='store_true', help='Use the cache only; never touch the network')
    ap.add_argument('--stdout', action='store_true', help='Print the pack JSON instead of writing packs/<id>.json')
    args = ap.parse_args(argv)
    OFFLINE = args.offline

    jobs = []
    if args.batch:
        with open(CITIES_FILE, encoding='utf-8') as fh:
            jobs = json.load(fh)['cities']
    elif args.city:
        jobs = [{'city': args.city, 'country': args.country, 'id': args.id, 'wikivoyageTitle': args.wikivoyage_title}]
    else:
        ap.error('give a city or --batch')

    failures = 0
    for job in jobs:
        try:
            pack = build_pack(job['city'], job.get('country'), job.get('id'), job.get('wikivoyageTitle'), want=args.max)
        except (SourceError, KeyError, ValueError) as err:
            failures += 1
            print(f"SKIP {job['city']}: {err}", file=sys.stderr)
            continue
        if args.stdout:
            print(json.dumps(pack, ensure_ascii=False, indent=2))
        else:
            path = write_pack(pack)
            print(summarize(pack))
            print(f'   -> {os.path.relpath(path, os.path.dirname(os.path.dirname(HERE)))}')
    return 1 if failures and failures == len(jobs) else 0


if __name__ == '__main__':
    sys.exit(main())
