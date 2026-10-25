"""Import the generated city packs (tools/places/packs/*.json) into Fermat's seed manifest as new destinations.

Only `pack["destination"]` is imported (`meta` is provenance). Human review fixes live here, never in the packs, so
regenerating a pack cannot overwrite them:
  - filler sights are dropped (stadiums, a flag pole, an office tower, one mistitled entry),
  - a few famous-sight prices and durations are corrected,
  - visa fields follow the engine's rules: visaKey/visaWaivedBy set where a held visa matters (US, UK, Schengen, UAE,
    Mexico), and visaLeadDays/entryAllowance are omitted so per-passport rules from src/lib/geo/visaRules.json apply
    (a present-but-null visaLeadDays would read as "curated: no visa needed" for Indian passports),
  - officialUrl points at the entry-rules page for international options (the UI labels it "Official entry rules"),
  - Indian packs get explicit Indian fare-table entries (seeds.departureCities), because the distance-band model
    prices every short domestic hop as a flight (Delhi to Rishikesh is a 5-hour bus or train, not a $160 flight).

Packs are appended after the existing catalog (seed order is the engine's last tie-break, so existing options keep
winning ties) and are NOT added to seeds.defaultShortlists.IN: Indian trips keep exactly the original 13 options by
default. Other home countries (no shortlist) see the whole catalog, so a US group now also gets Las Vegas, San Francisco
and Chicago as domestic options.

Costs stay in each pack's costCurrency (local currency); the engine converts with src/lib/geo/fx.json. Idempotent.

Usage: python3 -I import_city_packs.py <packs dir> <path to groupTripSeeds.v1.json>
"""
import glob
import json
import os
import sys

packs_dir, seeds_path = sys.argv[1], sys.argv[2]
seeds = json.load(open(seeds_path))
seeds["version"] = "2026.10.5"

TAGS = {"adventure", "art", "beach", "culture", "food", "nature", "nightlife", "shopping"}

DROP = {
    "abu-dhabi": {"uae-flag-pole", "mohammed-bin-zayed-stadium", "capital-gate"},
    "amsterdam": {"johan-cruyff-arena", "ziggo-dome"},
    "chicago": {"soldier-field"},
    "istanbul": {"ecumenical-patriarchate-of-constantinopl-fatih-mosque"},
    "kuala-lumpur": {"bukit-jalil-national-stadium"},
    "las-vegas": {"t-mobile-arena"},
    "mexico-city": {"estadio-azteca"},
}

# Activity fixes: id -> fields to override (costs in the pack's local currency).
PATCH = {
    "abu-dhabi": {"sheikh-zayed-grand-mosque": {"durationMinutes": 150}},
    "barcelona": {
        "sagrada-familia": {"costPerPerson": 33, "durationMinutes": 150},
        "casa-batllo": {"costPerPerson": 35, "durationMinutes": 90},
        "park-guell": {"costPerPerson": 18},
    },
    "hampi": {"vitthala-temple": {"durationMinutes": 150}, "ananthasayana-temple": {"durationMinutes": 60}},
    "london": {"local-food-walk": {"title": "Borough Market food walk", "location": "Southwark", "lat": 51.5055, "lon": -0.0910}},
    "mexico-city": {"xochimilco": {"title": "Xochimilco trajinera boat ride", "durationMinutes": 210, "costPerPerson": 250}},
    "san-francisco": {"alcatraz-island": {"costPerPerson": 45}, "golden-gate-bridge": {"title": "Golden Gate Bridge walk", "costPerPerson": 0}},
}

US_ENTRY = "https://travel.state.gov/content/travel/en/us-visas/tourism-visit.html"
SCHENGEN_ENTRY = "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en"
VISA = {
    # id: (visaKey, visaWaivedBy, officialUrl or None to keep the pack's)
    "las-vegas": ("us", [], US_ENTRY),
    "san-francisco": ("us", [], US_ENTRY),
    "chicago": ("us", [], US_ENTRY),
    "london": ("uk", [], "https://www.gov.uk/check-uk-visa"),
    "barcelona": ("schengen", [], SCHENGEN_ENTRY),
    "amsterdam": ("schengen", [], "https://www.netherlandsworldwide.nl/visa-the-netherlands"),
    "istanbul": (None, [], "https://www.evisa.gov.tr/"),
    "seoul": (None, [], "https://www.visa.go.kr/"),
    "kuala-lumpur": (None, [], "https://www.imi.gov.my/"),
    "abu-dhabi": ("uae", ["us", "uk", "schengen"], "https://u.ae/en/information-and-services/visa-and-emirates-id/tourist-visas"),
    "mexico-city": (None, ["us", "uk", "schengen"], "https://www.inm.gob.mx/"),
    "rishikesh": (None, [], None),
    "pondicherry": (None, [], None),
    "hampi": (None, [], None),
}

# Return fare per traveller in INR from the 13 Indian fare-table cities (illustrative, same basis as the existing table:
# bus or train for short hops, a flight plus a cab otherwise). Rishikesh: Dehradun airport or road from Delhi.
# Pondicherry: road from Chennai or Bengaluru, otherwise fly to Chennai. Hampi: overnight train or bus from Bengaluru,
# Goa and Hyderabad, otherwise fly to Hubballi or Bengaluru and take the train.
INDIAN_FARES = {
    "rishikesh": {"Delhi": 3000, "Mumbai": 12000, "Bengaluru": 14000, "Hyderabad": 13000, "Chennai": 15000, "Kolkata": 12000, "Pune": 13000,
                  "Ahmedabad": 11000, "Kochi": 16000, "Jaipur": 8000, "Goa": 14000, "Lucknow": 8000, "Chandigarh": 3000},
    "pondicherry": {"Delhi": 15000, "Mumbai": 12000, "Bengaluru": 4000, "Hyderabad": 9000, "Chennai": 2500, "Kolkata": 13000, "Pune": 12000,
                    "Ahmedabad": 14000, "Kochi": 9000, "Jaipur": 15000, "Goa": 10000, "Lucknow": 15000, "Chandigarh": 16000},
    "hampi": {"Delhi": 14000, "Mumbai": 9000, "Bengaluru": 3000, "Hyderabad": 4000, "Chennai": 7000, "Kolkata": 14000, "Pune": 7000,
              "Ahmedabad": 12000, "Kochi": 9000, "Jaipur": 14000, "Goa": 4000, "Lucknow": 15000, "Chandigarh": 16000},
}


def imported(pack):
    dest = dict(pack["destination"])
    pid = dest["id"]
    dest.pop("visaLeadDays", None)
    dest.pop("entryAllowance", None)
    visa_key, waived, url = VISA[pid]
    dest["visaKey"], dest["visaWaivedBy"] = visa_key, waived
    if url:
        dest["officialUrl"] = url
    acts = []
    for act in dest["activities"]:
        if act["id"] in DROP.get(pid, ()):
            continue
        acts.append({**act, **PATCH.get(pid, {}).get(act["id"], {})})
    missing = (set(DROP.get(pid, ())) | set(PATCH.get(pid, {}))) - {a["id"] for a in dest["activities"]}
    assert not missing, f"{pid}: review fixes refer to unknown activities {sorted(missing)}"
    dest["activities"] = acts
    assert set(dest["tags"]) <= TAGS and all(set(a["tags"]) <= TAGS for a in acts), pid
    assert all(isinstance(a["costPerPerson"], int) and 1 <= a["durationMinutes"] <= 210 for a in acts), pid
    assert len({a["id"] for a in acts}) == len(acts), pid
    return dest


existing = {d["id"] for d in seeds["destinations"]}
stop_ids = {s["id"] for d in seeds["destinations"] for s in d.get("stops", [])}
packs = [json.load(open(path)) for path in sorted(glob.glob(os.path.join(packs_dir, "*.json")))]
added = []
by_id = {d["id"]: i for i, d in enumerate(seeds["destinations"])}
for pack in packs:
    dest = imported(pack)
    if dest["id"] in by_id:  # re-run: refresh in place, keep position
        seeds["destinations"][by_id[dest["id"]]] = dest
    else:
        seeds["destinations"].append(dest)
        added.append(dest["id"])

for dest_id, fares in INDIAN_FARES.items():
    assert set(fares) == set(seeds["departureCities"]), dest_id
    for city, fare in fares.items():
        seeds["departureCities"][city][dest_id] = fare

with open(seeds_path, "w") as out:
    out.write(json.dumps(seeds, indent=2, ensure_ascii=False) + "\n")
print("added:", added or "none (refreshed)", "| catalog:", len(seeds["destinations"]), "| IN shortlist:", len(seeds["defaultShortlists"]["IN"]),
      "| pack ids that are also route stop ids:", sorted({p["destination"]["id"] for p in packs} & stop_ids))
