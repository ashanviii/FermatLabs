"""Expand Fermat's group-trip seed manifest: more departure cities, destinations, activities.

Usage: python3 -I expand_seeds.py <path to groupTripSeeds.v1.json>
All amounts are illustrative upper-bound INR estimates (return journeys per traveller).
"""
import json
import sys

path = sys.argv[1]
seeds = json.load(open(path))
seeds["version"] = "2026.10.2"

# Return-journey upper bounds per traveller, INR. Columns follow DEST_ORDER.
DEST_ORDER = ["bangkok", "dubai", "paris", "bali", "singapore", "hanoi", "goa", "manali"]
FARES = {
    "Delhi":      [34000, 30000, 72000, 42000, 30000, 32000, 14000, 6000],
    "Mumbai":     [36000, 27000, 70000, 40000, 29000, 34000, 8000, 18000],
    "Bengaluru":  [32000, 31000, 76000, 36000, 24000, 33000, 9000, 20000],
    "Hyderabad":  [35000, 30000, 75000, 39000, 26000, 33000, 10000, 19000],
    "Chennai":    [31000, 33000, 78000, 35000, 22000, 32000, 11000, 21000],
    "Kolkata":    [28000, 35000, 80000, 38000, 25000, 27000, 15000, 19000],
    "Pune":       [39000, 29000, 74000, 43000, 31000, 36000, 7000, 19000],
    "Ahmedabad":  [41000, 26000, 73000, 45000, 32000, 37000, 11000, 17000],
    "Kochi":      [33000, 26000, 78000, 37000, 24000, 35000, 10000, 22000],
    "Jaipur":     [38000, 27000, 74000, 46000, 34000, 36000, 14000, 9000],
    "Goa":        [40000, 29000, 77000, 44000, 32000, 37000, 1500, 21000],
    "Lucknow":    [37000, 30000, 76000, 46000, 34000, 35000, 15000, 12000],
    "Chandigarh": [39000, 31000, 75000, 47000, 35000, 37000, 16000, 4000],
}

NEW_DESTINATIONS = [
    {"id": "bali", "name": "Bali", "country": "Indonesia", "timeZone": "Asia/Makassar", "domestic": False,
     "tags": ["beach", "nature", "culture", "food"], "passportMonths": 6, "visaKey": None,
     "officialUrl": "https://evisa.imigrasi.go.id/", "reviewedAt": "2026-10-25",
     "roomCapacity": 2, "roomNight": 4800, "vehicleCapacity": 4, "vehicleDay": 3500,
     "foodDay": 1600, "insurance": 1800, "entryAllowance": 3500,
     "activities": [
         {"id": "ubud", "title": "Ubud rice terraces and monkey forest", "tags": ["culture", "nature"], "durationMinutes": 210, "location": "Ubud", "costPerPerson": 1500},
         {"id": "uluwatu", "title": "Uluwatu temple sunset and Kecak dance", "tags": ["culture"], "durationMinutes": 180, "location": "Uluwatu", "costPerPerson": 1400},
         {"id": "snorkel", "title": "Blue Lagoon snorkelling trip", "tags": ["beach", "nature", "adventure"], "durationMinutes": 210, "location": "Padang Bai", "costPerPerson": 2800},
         {"id": "beach-club", "title": "Seminyak beach club afternoon", "tags": ["beach", "nightlife"], "durationMinutes": 180, "location": "Seminyak", "costPerPerson": 2500},
     ]},
    {"id": "singapore", "name": "Singapore", "country": "Singapore", "timeZone": "Asia/Singapore", "domestic": False,
     "tags": ["food", "shopping", "nature", "culture"], "passportMonths": 6, "visaKey": "singapore",
     "officialUrl": "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements", "reviewedAt": "2026-10-25",
     "roomCapacity": 2, "roomNight": 11000, "vehicleCapacity": 4, "vehicleDay": 4500,
     "foodDay": 2600, "insurance": 1800, "entryAllowance": 3000,
     "activities": [
         {"id": "hawker", "title": "Hawker centre food trail", "tags": ["food"], "durationMinutes": 150, "location": "Maxwell and Chinatown", "costPerPerson": 1200},
         {"id": "gardens", "title": "Gardens by the Bay and Marina Bay walk", "tags": ["nature"], "durationMinutes": 180, "location": "Marina Bay", "costPerPerson": 2400},
         {"id": "little-india", "title": "Little India and Kampong Glam walk", "tags": ["culture", "shopping"], "durationMinutes": 180, "location": "Little India", "costPerPerson": 600},
         {"id": "sentosa", "title": "Sentosa beaches and cable car", "tags": ["beach", "adventure"], "durationMinutes": 210, "location": "Sentosa", "costPerPerson": 4500},
     ]},
    {"id": "hanoi", "name": "Hanoi & Ha Long", "country": "Vietnam", "timeZone": "Asia/Ho_Chi_Minh", "domestic": False,
     "tags": ["food", "culture", "nature", "adventure"], "passportMonths": 6, "visaKey": "vietnam",
     "officialUrl": "https://evisa.gov.vn/", "reviewedAt": "2026-10-25",
     "roomCapacity": 2, "roomNight": 3500, "vehicleCapacity": 4, "vehicleDay": 3000,
     "foodDay": 1300, "insurance": 1800, "entryAllowance": 2200,
     "activities": [
         {"id": "old-quarter", "title": "Old Quarter street-food walk", "tags": ["food", "culture"], "durationMinutes": 180, "location": "Hoan Kiem", "costPerPerson": 1200},
         {"id": "halong", "title": "Ha Long Bay express cruise", "tags": ["nature", "adventure"], "durationMinutes": 210, "location": "Ha Long Bay", "costPerPerson": 5500},
         {"id": "literature", "title": "Temple of Literature and Hoan Kiem Lake", "tags": ["culture"], "durationMinutes": 150, "location": "Dong Da", "costPerPerson": 700},
         {"id": "ninh-binh", "title": "Ninh Binh river boat ride", "tags": ["nature", "adventure"], "durationMinutes": 210, "location": "Trang An", "costPerPerson": 3500},
     ]},
    {"id": "goa", "name": "Goa", "country": "India", "timeZone": "Asia/Kolkata", "domestic": True,
     "tags": ["beach", "nightlife", "food", "nature"], "passportMonths": 0, "visaKey": None,
     "officialUrl": "https://goa-tourism.com/", "reviewedAt": "2026-10-25",
     "roomCapacity": 2, "roomNight": 4000, "vehicleCapacity": 4, "vehicleDay": 2500,
     "foodDay": 1500, "insurance": 500, "entryAllowance": 0,
     "activities": [
         {"id": "north-beaches", "title": "North Goa beach hop", "tags": ["beach", "nightlife"], "durationMinutes": 180, "location": "Anjuna to Vagator", "costPerPerson": 800},
         {"id": "old-goa", "title": "Old Goa churches and Fontainhas walk", "tags": ["culture"], "durationMinutes": 150, "location": "Old Goa", "costPerPerson": 300},
         {"id": "dudhsagar", "title": "Dudhsagar falls jeep safari", "tags": ["nature", "adventure"], "durationMinutes": 210, "location": "Mollem", "costPerPerson": 2500},
         {"id": "cruise", "title": "Mandovi sunset cruise", "tags": ["nightlife", "beach"], "durationMinutes": 120, "location": "Panaji", "costPerPerson": 1200},
     ]},
    {"id": "manali", "name": "Manali", "country": "India", "timeZone": "Asia/Kolkata", "domestic": True,
     "tags": ["nature", "adventure", "culture"], "passportMonths": 0, "visaKey": None,
     "officialUrl": "https://himachaltourism.gov.in/", "reviewedAt": "2026-10-25",
     "roomCapacity": 2, "roomNight": 3500, "vehicleCapacity": 6, "vehicleDay": 3500,
     "foodDay": 1200, "insurance": 500, "entryAllowance": 0,
     "activities": [
         {"id": "solang", "title": "Solang Valley paragliding and ropeway", "tags": ["adventure", "nature"], "durationMinutes": 210, "location": "Solang", "costPerPerson": 2000},
         {"id": "old-manali", "title": "Old Manali cafes and Hadimba temple", "tags": ["culture"], "durationMinutes": 150, "location": "Old Manali", "costPerPerson": 300},
         {"id": "atal-tunnel", "title": "Atal Tunnel and Sissu day trip", "tags": ["nature", "adventure"], "durationMinutes": 210, "location": "Sissu", "costPerPerson": 2500},
         {"id": "rafting", "title": "Beas river rafting", "tags": ["adventure"], "durationMinutes": 180, "location": "Kullu", "costPerPerson": 1500},
     ]},
]

EXTRA_ACTIVITIES = {
    "bangkok": [
        {"id": "floating-market", "title": "Floating market morning", "tags": ["culture", "food"], "durationMinutes": 210, "location": "Damnoen Saduak", "costPerPerson": 1800},
        {"id": "rooftop", "title": "Riverside and rooftop evening", "tags": ["nightlife"], "durationMinutes": 150, "location": "Silom", "costPerPerson": 2500},
    ],
    "dubai": [
        {"id": "desert-safari", "title": "Desert safari and dune drive", "tags": ["adventure", "nature"], "durationMinutes": 210, "location": "Lahbab desert", "costPerPerson": 4500},
        {"id": "burj", "title": "Burj Khalifa and Dubai Mall", "tags": ["shopping"], "durationMinutes": 180, "location": "Downtown", "costPerPerson": 4000},
    ],
    "paris": [
        {"id": "seine", "title": "Seine river cruise", "tags": ["culture"], "durationMinutes": 120, "location": "Pont Neuf", "costPerPerson": 1800},
        {"id": "versailles", "title": "Palace of Versailles", "tags": ["culture", "art"], "durationMinutes": 210, "location": "Versailles", "costPerPerson": 3200},
    ],
}

existing = {d["id"]: d for d in seeds["destinations"]}
for dest_id, extras in EXTRA_ACTIVITIES.items():
    known = {a["id"] for a in existing[dest_id]["activities"]}
    existing[dest_id]["activities"] += [a for a in extras if a["id"] not in known]
for dest in seeds["destinations"]:
    dest.setdefault("domestic", False)
seeds["destinations"] += [d for d in NEW_DESTINATIONS if d["id"] not in existing]

ids = [d["id"] for d in seeds["destinations"]]
assert ids == DEST_ORDER, ids
seeds["departureCities"] = {city: dict(zip(DEST_ORDER, fares)) for city, fares in FARES.items()}
for d in seeds["destinations"]:
    assert all(a["durationMinutes"] <= 210 for a in d["activities"]), d["id"]  # 10:00 slot must end by the 13:30 meal

json.dump(seeds, open(path, "w"), indent=2, ensure_ascii=False)
open(path, "a").write("\n")
print(f"version {seeds['version']}: {len(seeds['departureCities'])} cities x {len(ids)} destinations, "
      f"{sum(len(d['activities']) for d in seeds['destinations'])} activities")
