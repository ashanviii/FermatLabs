# Places pipeline: an itinerary for any city from free data

**Question from the founder:** "It's so difficult to cover all popular destinations. Are there free APIs so that for any city X, in India or outside India, we can create an itinerary?"

**Short answer:** yes, for cities that have a Wikivoyage article, which covers almost every city a group would pick. Four free, keyless sources together give us a usable destination pack in 30–60 seconds per city (or under a second from cache):

- **Wikivoyage** decides what is worth visiting. Volunteer editors have already picked the sights.
- **Wikidata** supplies the facts: coordinates, what kind of place each sight is, country, currency, population.
- **Wikipedia pageviews** rank the sights by real popularity.
- **World Bank PPP** scales prices into the local currency.

Nothing here needs a paid API, an API key, or a new npm dependency. A pack is a starting point: it still needs a human look before it goes into the catalog (about five minutes per city).

```
python3 -I tools/places/city_pack.py "Lisbon" --country PT     # -> tools/places/packs/lisbon.json
```

---

## 1. What is reachable from this machine (tested 2026-10-25, corporate proxy)

| Source | Reachable? | What it gives us | Limits seen / documented | Licence and attribution |
|---|---|---|---|---|
| Wikivoyage MediaWiki API `en.wikivoyage.org/w/api.php` | **Yes** (curl, Python urllib, node with `NODE_USE_ENV_PROXY=1`) | City article wikitext: `{{see}}` / `{{do}}` / `{{listing}}` / `{{marker}}` entries with name, lat/long, `wikidata=` QID, price and opening-hours text; Districts, Eat/Drink and "Go next" sections; tourist office URL | **HTTP 429 after about 12 fast requests.** The generator waits 1.5 s between calls and honours Retry-After. Big cities split sights into district pages (London has 28), so they need more requests | CC BY-SA 4.0. We store only names and coordinates (facts) plus a credit line. We never copy listing prose into the product |
| Wikidata SPARQL `query.wikidata.org` | **Yes** | City QID facts (P17 country, P297 ISO code, P38/P498 currency, P1082 population, P625 coordinates, P856 website); sights within a radius (`wikibase:around`) with sitelink counts, P31 classes, P131 area, P1435 heritage status | 60 s query timeout. A single query that joins "around" with labels and classes **timed out** for Barcelona, so we run two small queries (ids, then details for batches of 80). We pace at 1 request per second | CC0 (no attribution needed; we credit it anyway) |
| Wikidata Action API / EntityData `www.wikidata.org` | **No**: TLS fails with "unable to get local issuer certificate" through the proxy | (Would give full entity JSON) | Not needed, because SPARQL covers it | CC0 |
| Wikimedia pageviews REST `wikimedia.org/api/rest_v1/metrics/pageviews` | **Yes** | 12 months of English Wikipedia views per sight (the main popularity signal). `top/en.wikivoyage/...` returns the 1,000 most-read Wikivoyage articles, which is a ready-made "which cities to add next" list | Documented limit is 100 req/s; we use about 7 req/s | Data is CC0 |
| Wikipedia REST `en.wikipedia.org/api/rest_v1/page/summary` | **Yes** | One-line summary and image for a sight (not used yet; good for a future "about this place" card) | Same as Wikimedia | Text is CC BY-SA 4.0: needs attribution if shown |
| World Bank API `api.worldbank.org/v2` | **Yes** | `PA.NUS.PRVT.PP` (household-consumption PPP, local currency per international $), `PA.NUS.FCRF` (official LCU per USD), for every country. `PA.NUS.PPPC.RF` (price level ratio) is **archived** and returns "indicator not found" | No key needed, generous limits. Values are annual (latest: 2025) | CC BY 4.0: credit "World Bank" |
| tz database `/usr/share/zoneinfo/zone.tab` | **Yes** (local file) | Nearest IANA zone for the country (we use `zone.tab`, not `zone1970.tab`, so we get Europe/Amsterdam and not Europe/Brussels) | Multi-zone countries are resolved by nearest principal city. That is right for every pack here, but check it near zone borders | Public domain |
| Frankfurter `api.frankfurter.dev` | **Yes** | Daily ECB exchange rates for 30 currencies (INR, USD, EUR, GBP, KRW, MYR, MXN, TRY...) | **No AED or VND** (and others). AED is pegged at 3.6725/USD. Otherwise fall back to World Bank FCRF | Free, no key |
| Photon geocoder `photon.komoot.io` (OSM) | **Yes** | Free-text geocoding (city to lat/lon) | Fair use only, no SLA | ODbL: "© OpenStreetMap contributors" |
| OSM Nominatim `nominatim.openstreetmap.org` | **No** (TLS issuer error) | Geocoding | 1 req/s policy | ODbL |
| OSM Overpass `overpass-api.de`, `overpass.kumi.systems` | **No** (connection times out after 20 s) | Raw POIs (tourism=attraction, museum, viewpoint...) | Heavy queries are rate-limited | ODbL: attribution plus share-alike on derived databases |
| OpenTripMap `api.opentripmap.com` | **No** (TLS issuer error); also needs a free key | POIs with a popularity "rate" (built on OSM and Wikidata) | Free tier needs a key | ODbL / CC BY-SA |
| Geoapify `api.geoapify.com` | **No** (TLS issuer error); needs a free key | Places API (built on OSM), 3,000 req/day free | Key required | ODbL |
| GeoNames `download.geonames.org` (cities15000) | **No** (TLS issuer error) | Every city with population over 15k, with tz and coordinates | n/a | CC BY 4.0 |
| GitHub raw (for example `dr5hn/countries-states-cities-database`, `ilyankou/passport-index-dataset`) | **Yes** | Mirrors of GeoNames-style city lists. Passport-by-destination visa requirement CSV | The passport index repo is **archived (last update 2025-01-12)**, so visa data from it is stale | MIT (passport index); check each repo |
| Hugging Face datasets `huggingface.co/api/datasets` | **Yes** | Wikivoyage/Wikipedia dump mirrors (for example `bigscience-data/roots_en_wikivoyage`, gated) | Mirrors are old (2022) | Same as the source (CC BY-SA) |
| dumps.wikimedia.org | **Yes** | `enwikivoyage-latest-pages-articles.xml.bz2` (132 MB): every article offline. This is the bulk path if we ever want all 30k destinations without hitting the API | Monthly dumps | CC BY-SA 4.0 |

**Bottom line:** the Wikimedia family plus World Bank is all reachable and enough. The OSM-based POI APIs are blocked here (TLS interception or timeouts) and most of them need keys anyway, so the pipeline does not depend on them.

## 2. The pipeline (what `tools/places/city_pack.py` does)

```
city name (+ ISO country)
  │
  ├─ Wikivoyage: resolve the article → wikitext + the article's Wikidata QID
  │     ├─ parse See/Do listings and markers (name, lat/long, wikidata=Q…)
  │     ├─ big cities: also fetch up to 10 district pages (London/Westminster…)
  │     └─ keep Do-section prose (rafting, yoga, diving…) and the "Go next" links
  ├─ Wikidata: city facts (country, ISO-2, currency, population, coordinates)
  ├─ Wikidata: notable items within 10–14 km (≥8 sitelinks; small towns 12 km, ≥3 sitelinks)
  ├─ Wikidata: classes, area, heritage status, enwiki title for every candidate
  ├─ filter: drop people, events, teams, companies, universities, stations, destroyed buildings...
  │          keep Wikivoyage-curated sights and recognisable visitor categories
  ├─ score = log10(enwiki views 12 mo) + 1.2·log10(sitelinks) + 0.6 if Wikivoyage lists it
  │          + 0.5 if the main See section names it + 0.2 if heritage
  │          − penalties (stadiums, office towers, far away)
  ├─ select up to 12 with diversity caps (≤3 religious, ≤3 museums, 1 stadium, 1 tower…)
  ├─ guarantee a food option (best market or eatery; otherwise a generic "local food walk")
  ├─ add up to 2–3 signature activities found in Do prose ("River rafting in Rishikesh")
  ├─ add a "Day trip to X" when a nearby town is in Wikivoyage's own "Go next" list
  ├─ pair short sights (≤90 min) within 1.2 km into one half-day block ("Westminster Abbey and Whitehall")
  ├─ map each to our tags, durationMinutes (≤210) and costPerPerson
  └─ city costs = international-$ basis × World Bank PPP × city-size multiplier
```

Every HTTP response is cached under `tools/places/cache/<host>/` (gitignored, about 20 MB for 14 cities plus calibration), so reruns are offline (`--offline`) and give the same output. Each source fails on its own: Wikivoyage down means Wikidata-only candidates; pageviews down means sitelinks-only ranking; no World Bank PPP for a country means the city is skipped with a message. The failures are listed in `meta.sourcesFailed`.

### Tag, duration and cost mapping (category → tags, minutes, base cost in international $)

| Category (from Wikidata classes / listing name) | Tags | Minutes | Base $ | Notes |
|---|---|---|---|---|
| theme park / water park | adventure (+beach) | 210 | 75 / 45 | |
| zoo, aquarium | nature, adventure | 180 | 30 | |
| art museum / museum | art, culture / culture | 150 | 20 / 18 | ×1.6 if ≥60 sitelinks, ×2.2 if ≥100 ("famous premium") |
| palace, castle, fort | culture, art | 150 | 20 | famous premium |
| archaeological site | culture | 180 | 12 | famous premium |
| cathedral / temple, mosque, church | culture | 90 / 60 (90 if heritage or ≥25 sitelinks) | 8 / 0 | |
| park, garden, lake, mountain | nature (+adventure) | 120–180 | 0–12 | |
| river, canal, bay | nature | 120 | 20 | titled "X boat cruise" |
| market / eatery | food, shopping / food | 120 / 90 | 20 / 30 | |
| casino, show, theatre | nightlife (+art) | 180 / 150 | 40 / 55 | |
| neighbourhood, old town | culture, food | 150 | 10 | |
| tower, observation deck | culture | 90 | 25 | famous premium |
| square, monument, street | culture (+shopping) | 60–90 | 0 | |
| stadium | culture, adventure | 90 | 30 | penalised in ranking |
| prose activity (rafting, diving, yoga, show...) | per activity | 60–210 | 6–150 | |
| day trip (Go next town) | culture, nature | 210 | 15 | |

Local cost = base × `PA.NUS.PRVT.PP` (local currency per international $), rounded to a friendly figure (₹1,200, €35, ₩18,000).

### City-level costs and calibration

`roomNight = 170`, `vehicleDay = 110`, `foodDay = 55`, `insurance = 25` (international $) × PPP × city multiplier (1.2 for 5M+ people, 1.1 for 1M+, 1.0 for 250k+, 0.95 below). `roomCapacity` is 2, `vehicleCapacity` is 4, `entryAllowance` is 0.

`python3 -I tools/places/calibrate.py` regenerates these costs for 12 seed cities and stops and compares them in INR with the hand-curated seeds (`tools/places/calibration.json`):

| | median pack/seed | range |
|---|---|---|
| roomNight | **1.01** | 0.83 (Udaipur) to 1.44 (Hanoi) |
| foodDay | **1.02** | 0.77 (Udaipur) to 1.79 (Singapore) |
| vehicleDay | **0.93** | 0.57 (Manali, Munnar: hill driving) to 2.07 (Singapore) |

So the model reproduces our curated numbers on the median. It runs high in rich city-states (Singapore, Dubai, Abu Dhabi) and low for hill-station cabs. Those outliers are what the human review step is for.

## 3. Packs generated (`tools/places/packs/<id>.json`)

Each file is `{ "destination": <schema object>, "meta": <provenance, price level, ranking scores> }`. `python3 -I tools/places/validate_packs.py` checks every pack against the shared schema (14/14 valid).

| id | Currency | Quality note (spot-checked by eye) |
|---|---|---|
| `las-vegas` | USD | Strong: Sphere, the Strip, Bellagio fountains and High Roller, Fremont Street, Mob Museum, plus an "Evening show" taken from the Do prose. T-Mobile Arena is filler. No Hoover Dam or Red Rock (outside the radius) |
| `san-francisco` | USD | Strong: Golden Gate Bridge, Alcatraz, Golden Gate Park, Ferry Building (food), de Young, Cal Academy, Exploratorium. Alcatraz costs only $10 (the real ferry is about $45) |
| `chicago` | USD | Strong: Art Institute, Millennium Park + Cloud Gate, Shedd, Museum of Science and Industry, river cruise, Second City. Soldier Field is ranked too high |
| `barcelona` | EUR | Strong: Sagrada Família, Park Güell, La Boqueria, La Rambla + Cathedral, Gothic Quarter, Palau de la Música, Casa Batlló. Ticket prices are low (Sagrada shows €10; the real price is about €26) |
| `london` | GBP | Strong: Tower of London, British Museum, Buckingham Palace, Westminster Abbey, St Paul's, National Gallery, Hyde Park. Uses a generic food walk because Borough Market is in a district page we don't fetch. The Gherkin is filler |
| `amsterdam` | EUR | Strong: Rijksmuseum, Van Gogh Museum, Anne Frank House, Vondelpark, Albert Cuyp Market, canal cruise (Amstel), Dam Square, Artis. Two concert or football venues are filler |
| `istanbul` | TRY | Strong: Hagia Sophia, Basilica Cistern, Topkapı, Blue Mosque, Galata Tower, Dolmabahçe, Golden Horn cruise, Grand Bazaar. "Ecumenical Patriarchate" is an odd title |
| `seoul` | KRW | Strong: Gyeongbokgung, Changdeokgung, Cheonggyecheon, Namdaemun Market, National Museum, Namsan. Myeongdong and Hongdae are missing |
| `kuala-lumpur` | MYR | Good: Petronas Towers, Batu Caves, Central Market, National Mosque, Merdeka Square, Bukit Bintang. The heritage railway station got paired into a block |
| `abu-dhabi` | AED | Weakest: Louvre, Sheikh Zayed Grand Mosque, Yas Island and Qasr Al Hosn are right, but "UAE flag pole", a stadium and Capital Gate are filler. Emirates Palace and the Corniche are missing. Needs a hand edit |
| `mexico-city` | MXN | Strong: Zócalo + Cathedral, Frida Kahlo Museum, Templo Mayor, Chapultepec Castle, Bellas Artes, National Palace. Xochimilco is listed as 60 min (should be a 3-hour boat trip). No Teotihuacan (45 km away) |
| `rishikesh` | INR | Good thanks to prose activities: river rafting, yoga, a trek, Beatles Ashram, Lakshman and Ram Jhula, Triveni Ghat, Neelkanth. 11 activities. Most listings have no QID, so ranking falls back to Wikivoyage order |
| `pondicherry` | INR | Good: day trip to Auroville, Aurobindo Ashram, scuba and kayaking (from prose), Promenade Beach, White Town sights. Arikamedu is ranked too high |
| `hampi` | INR | Good: Virupaksha, Vitthala, Lotus Mahal, Matanga Hill, bouldering and coracle ride (from prose). Temple durations are short for a ruins site, and "Vijayanagara" is a generic title |

## 4. How to add a city (one command)

```bash
cd FermatLabs-master
python3 -I tools/places/city_pack.py "Lisbon" --country PT            # writes tools/places/packs/lisbon.json
python3 -I tools/places/city_pack.py "Cambridge" --country GB --wikivoyage-title "Cambridge (England)"
python3 -I tools/places/city_pack.py "Goa" --stdout                   # print instead of writing
python3 -I tools/places/validate_packs.py                             # schema check, id collisions
```

To make a city part of the reproducible batch, add it to `tools/places/cities.json` and run `--batch`. Then review the pack by eye (five-minute checklist):

1. Are the names real, and are the top four the things a friend would say "you must do"?
2. Delete filler (stadiums, office towers, flag poles) and add one obvious miss if needed.
3. Check paid-sight prices for world-famous places: the model underprices them.
4. Check `timeZone` for multi-zone countries, and check `officialUrl` (it comes from the Wikivoyage tourist-office listing, then the city website).
5. Edit in the catalog import step, not in the pack, so a regenerated pack never overwrites a human fix. Better still, fix the generator rules.

**Choosing which cities to add:** `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikivoyage/all-access/2026/09/all-days` lists the 1,000 most-read Wikivoyage pages. Filter out countries and regions and you have a demand-ranked city backlog (Singapore, New York, Paris, Sydney, Amsterdam, London, Barcelona, Berlin, Bangalore, Seattle, Istanbul...).

## 5. Quality caveats

- **Popularity is not suitability.** Pageviews reward stadiums, skyscrapers and news. The pipeline penalises these and caps categories, but still let a human check every pack.
- **Big cities depend on district pages.** We fetch the first 10 districts listed. Sights in later districts (Borough Market in Southwark) can be missed.
- **Small towns depend on Wikivoyage listings without QIDs.** Their ranking falls back to article order, and businesses (yoga schools, dive shops) are filtered with keyword rules, not understood.
- **Day trips beyond about 25–30 km are not covered** (Hoover Dam, Teotihuacan, Versailles, Montserrat). A future "day trip" stop type could use the "Go next" list for these.
- **Costs are PPP estimates.** They match our curated seeds on the median, but famous paid sights and foreigner tickets (India's monuments) are underpriced. Room prices are mid-range double rooms, not peak-season rates.
- **Visa and passport fields are not derived.** `visaKey`, `visaLeadDays` and `visaWaivedBy` depend on the traveller's passport and must come from the curated visa table. `passportMonths` is a conservative destination rule (Schengen 3, UK/US/Mexico/Korea 0, Turkey 5, otherwise 6). India gets 6 because that is the rule for foreign visitors; Indian groups are covered by the engine's domestic check.
- **`insurance` is a destination-side estimate** (25 international $). Insurance really depends on where the traveller comes from.
- **Licences:** Wikivoyage and Wikipedia text is CC BY-SA. We keep names and coordinates only and show the `attribution` string wherever a pack's places appear (for example in the plan footer). Never paste listing descriptions into the product without a share-alike review.

## 6. A runtime "any city" feature later

The batch tool runs offline today. The same logic can serve "plan a trip to *any* city":

1. **API route** `/api/places/pack?city=…&country=…` (Next.js route handler, server-side `fetch`, no new dependency). Port the Python modules to TypeScript: listing parser, SPARQL queries, classifier and cost model, about 600 lines.
2. **Cache in Firestore** under `placePacks/{countryCode}-{slug}` with `generatedAt` and `reviewed: false`. Serve from cache, regenerate after 90 days, and never regenerate a pack that has `reviewed: true`. One generation costs about 15–60 requests (2–30 s), so it should run once per city, not once per user.
3. **Free-tier budget:** Firestore Spark gives 50k reads and 20k writes per day, so caching packs is negligible. Wikimedia has no quota but asks for a descriptive User-Agent and polite pacing. Wikivoyage's 429 means generation must be queued (one city at a time, with the 1.5 s pacing), never fanned out per request. Serverless functions on free tiers have short timeouts, so run generation as a background job (Cloud Function or Firestore-triggered) and show "building your city…" in the UI.
4. **UX:** a city created on demand appears with an "Estimated — community data" badge, the attribution line and a "Report a wrong place" link. A founder review queue flips `reviewed: true`.
5. **Currency:** packs carry `costCurrency`. The engine converts to the group's currency with Frankfurter (30 currencies, cached daily), and uses World Bank `PA.NUS.FCRF` or a peg table (AED, SAR, QAR...) for the rest.

## 7. Why LLM-generated itineraries are deferred

- **Cost:** every user-specific itinerary would be a paid model call. Fermat's rule is zero spend, while packs are generated once and cached.
- **Hallucination:** LLMs invent sights, merge places, and are confidently wrong about prices and opening days. Every activity in a pack traces back to a Wikidata QID or Wikivoyage listing with coordinates (`meta.ranking`), which we can verify, and correct when it's wrong.
- **Privacy and determinism:** the group engine must give every member the same plan from the same inputs. Packs are deterministic and cacheable. LLM output isn't.
- **Where an LLM could help later:** writing friendly one-line descriptions for already-verified places, or grouping pack activities into themed days. In both cases it would work on top of grounded data, never as the source of places.
