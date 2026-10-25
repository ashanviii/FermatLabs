#!/usr/bin/env python3
"""Check every tools/places/packs/*.json against the shared destination schema.

    python3 -I tools/places/validate_packs.py

Exit code 1 on any error. Also flags id collisions with the current seed file.
"""

import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SEEDS = os.path.normpath(os.path.join(HERE, '..', '..', 'chatgpt-ai-template-main', 'src', 'lib', 'groupTripSeeds.v1.json'))
TAGS = {'food', 'culture', 'nightlife', 'shopping', 'art', 'beach', 'nature', 'adventure'}
REQUIRED = ['id', 'name', 'country', 'countryCode', 'lat', 'lon', 'timeZone', 'costCurrency', 'tags', 'passportMonths',
            'visaKey', 'visaLeadDays', 'visaWaivedBy', 'officialUrl', 'reviewedAt', 'roomCapacity', 'roomNight',
            'vehicleCapacity', 'vehicleDay', 'foodDay', 'insurance', 'entryAllowance', 'activities', 'source',
            'attribution']
MONEY = ['roomNight', 'vehicleDay', 'foodDay', 'insurance', 'entryAllowance']


def check(dest, seed_ids):
    errs = []
    for key in REQUIRED:
        if key not in dest:
            errs.append(f'missing {key}')
    if errs:
        return errs
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', dest['id']):
        errs.append(f"bad id {dest['id']!r}")
    if dest['id'] in seed_ids:
        errs.append(f"id {dest['id']!r} collides with an existing seed destination")
    if not re.fullmatch(r'[A-Z]{2}', dest['countryCode'] or ''):
        errs.append('countryCode must be ISO-3166 alpha-2')
    if not re.fullmatch(r'[A-Z]{3}', dest['costCurrency'] or ''):
        errs.append('costCurrency must be ISO-4217')
    if not (-90 <= dest['lat'] <= 90 and -180 <= dest['lon'] <= 180):
        errs.append('lat/lon out of range')
    if not dest['timeZone'] or '/' not in dest['timeZone']:
        errs.append('timeZone must be an IANA zone')
    if not set(dest['tags']) <= TAGS or not dest['tags']:
        errs.append(f"tags {dest['tags']} outside vocabulary")
    for key in MONEY + ['roomCapacity', 'vehicleCapacity', 'passportMonths']:
        if not isinstance(dest[key], int) or dest[key] < 0:
            errs.append(f'{key} must be a non-negative integer')
    if dest['roomCapacity'] < 1 or dest['vehicleCapacity'] < 1:
        errs.append('capacities must be >= 1')
    acts = dest['activities']
    if not 4 <= len(acts) <= 12:
        errs.append(f'{len(acts)} activities (want 4-12)')
    ids = [a.get('id') for a in acts]
    if len(set(ids)) != len(ids):
        errs.append('duplicate activity ids')
    for a in acts:
        where = f"activity {a.get('id')!r}"
        for key in ('id', 'title', 'tags', 'durationMinutes', 'location', 'costPerPerson'):
            if key not in a:
                errs.append(f'{where}: missing {key}')
        if not set(a.get('tags', [])) <= TAGS or not a.get('tags'):
            errs.append(f'{where}: bad tags')
        dur = a.get('durationMinutes')
        if not isinstance(dur, int) or not 1 <= dur <= 210:
            errs.append(f'{where}: durationMinutes must be 1..210')
        if not isinstance(a.get('costPerPerson'), int) or a['costPerPerson'] < 0:
            errs.append(f'{where}: costPerPerson must be a non-negative integer')
        if ('lat' in a) != ('lon' in a):
            errs.append(f'{where}: lat and lon go together')
        extra = set(a) - {'id', 'title', 'tags', 'durationMinutes', 'location', 'costPerPerson', 'lat', 'lon'}
        if extra:
            errs.append(f'{where}: unexpected keys {sorted(extra)}')
    return errs


def main():
    seed_ids = set()
    if os.path.exists(SEEDS):
        with open(SEEDS, encoding='utf-8') as fh:
            seed_ids = {d['id'] for d in json.load(fh)['destinations']}
    bad = 0
    files = sorted(glob.glob(os.path.join(HERE, 'packs', '*.json')))
    for path in files:
        with open(path, encoding='utf-8') as fh:
            pack = json.load(fh)
        errs = check(pack['destination'], seed_ids)
        name = os.path.basename(path)
        if pack['destination']['id'] + '.json' != name:
            errs.append('file name must be <id>.json')
        print(f"{'OK  ' if not errs else 'FAIL'} {name} ({len(pack['destination']['activities'])} activities)")
        for e in errs:
            print('     -', e)
        bad += bool(errs)
    print(f'{len(files) - bad}/{len(files)} packs valid')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
