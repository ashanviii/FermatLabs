#!/usr/bin/env python3
"""Compare generated city-level costs with the hand-curated seed numbers.

    python3 -I tools/places/calibrate.py            # uses the cache, fetches what is missing
    python3 -I tools/places/calibrate.py --offline

For each seed city that is a single place (not a state or island) it builds a
pack in memory (nothing is written to packs/), converts the pack's local-currency
costs to INR with World Bank official exchange rates, and prints pack / seed
ratios. Writes tools/places/calibration.json. Ratios near 1.0 mean the PPP model
reproduces the curated numbers; the docs record the current spread.
"""

import json
import os
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import city_pack  # noqa: E402  (local module, stdlib only)

SEEDS = os.path.normpath(os.path.join(HERE, '..', '..', 'chatgpt-ai-template-main', 'src', 'lib', 'groupTripSeeds.v1.json'))

# seed id or "route/stop id" -> (city, country code)
TARGETS = {
    'bangkok': ('Bangkok', 'TH'),
    'dubai': ('Dubai', 'AE'),
    'paris': ('Paris', 'FR'),
    'singapore': ('Singapore', 'SG'),
    'hanoi': ('Hanoi', 'VN'),
    'manali': ('Manali', 'IN'),
    'thailand-duo/phuket': ('Phuket', 'TH'),
    'uae-duo/abu-dhabi': ('Abu Dhabi', 'AE'),
    'kerala-trio/kochi': ('Kochi', 'IN'),
    'kerala-trio/munnar': ('Munnar', 'IN'),
    'rajasthan-duo/jaipur': ('Jaipur', 'IN'),
    'rajasthan-duo/udaipur': ('Udaipur', 'IN'),
}
FIELDS = ('roomNight', 'foodDay', 'vehicleDay')


def seed_costs(seeds, key):
    if '/' in key:
        route, stop = key.split('/')
        dest = next(d for d in seeds['destinations'] if d['id'] == route)
        return next(s for s in dest['stops'] if s['id'] == stop)
    return next(d for d in seeds['destinations'] if d['id'] == key)


def main(argv=None):
    args = argv if argv is not None else sys.argv[1:]
    city_pack.OFFLINE = '--offline' in args
    with open(SEEDS, encoding='utf-8') as fh:
        seeds = json.load(fh)
    inr_per_usd = city_pack.market_fx('IN')
    rows, ratios = [], {f: [] for f in FIELDS}
    for key, (city, cc) in TARGETS.items():
        try:
            pack = city_pack.build_pack(city, cc, want=8)
        except (city_pack.SourceError, KeyError, ValueError) as err:
            print(f'SKIP {key}: {err}')
            continue
        d = pack['destination']
        lcu_per_usd = pack['meta']['priceLevel']['lcuPerUsd']
        to_inr = inr_per_usd / lcu_per_usd
        seed = seed_costs(seeds, key)
        row = {'seed': key, 'currency': d['costCurrency']}
        for f in FIELDS:
            gen_inr = round(d[f] * to_inr)
            row[f] = {'pack': d[f], 'packInr': gen_inr, 'seedInr': seed[f], 'ratio': round(gen_inr / seed[f], 2)}
            ratios[f].append(gen_inr / seed[f])
        rows.append(row)
        print(f"{key:24} " + '  '.join(f"{f}={row[f]['packInr']:>6}/{row[f]['seedInr']:<6}x{row[f]['ratio']:.2f}" for f in FIELDS))
    summary = {f: {'median': round(statistics.median(v), 2), 'min': round(min(v), 2), 'max': round(max(v), 2)}
               for f, v in ratios.items() if v}
    print('median pack/seed:', {f: s['median'] for f, s in summary.items()})
    with open(os.path.join(HERE, 'calibration.json'), 'w', encoding='utf-8') as fh:
        json.dump({'inrPerUsd': inr_per_usd, 'rows': rows, 'summary': summary}, fh, indent=2)
        fh.write('\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
