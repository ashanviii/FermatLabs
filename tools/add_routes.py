"""Add hand-curated multi-city routes to Fermat's seed manifest.

A route is a destination with `stops` (nights are split by `weight`) and `transfers` between consecutive stops.
A stop may inherit costs and activities from an existing single-city destination via `fromDestination`.
Fares are open-jaw return totals per traveller (fly into the first stop, home from the last). Illustrative INR.

Usage: python3 -I add_routes.py <path to groupTripSeeds.v1.json>
"""
import json
import sys

path = sys.argv[1]
seeds = json.load(open(path))
seeds["version"] = "2026.10.3"


def act(id, title, tags, minutes, location, cost):
    return {"id": id, "title": title, "tags": tags, "durationMinutes": minutes, "location": location, "costPerPerson": cost}


ROUTES = [
    {"id": "thailand-duo", "name": "Thailand: Bangkok + Phuket", "country": "Thailand", "timeZone": "Asia/Bangkok", "domestic": False,
     "tags": ["food", "culture", "nightlife", "beach", "nature"], "passportMonths": 6, "visaKey": None, "visaLeadDays": None, "visaWaivedBy": [],
     "officialUrl": "https://www.thaievisa.go.th/", "reviewedAt": "2026-10-25", "roomCapacity": 2, "insurance": 1800, "entryAllowance": 3500,
     "stops": [
         {"id": "bangkok", "name": "Bangkok", "weight": 2, "fromDestination": "bangkok"},
         {"id": "phuket", "name": "Phuket", "weight": 3, "roomNight": 5000, "vehicleCapacity": 4, "vehicleDay": 4000, "foodDay": 1800, "activities": [
             act("phi-phi", "Phi Phi islands speedboat day", ["beach", "nature", "adventure"], 210, "Phi Phi", 3500),
             act("phuket-old-town", "Phuket Old Town food walk", ["culture", "food"], 150, "Old Town", 500),
             act("big-buddha", "Big Buddha and Karon viewpoint", ["culture", "nature"], 150, "Chalong", 400),
             act("patong", "Patong beach evening", ["nightlife", "beach"], 150, "Patong", 1500)]}],
     "transfers": [{"title": "Fly Bangkok → Phuket", "mode": "flight", "costPerPerson": 4500, "durationMinutes": 240}]},
    {"id": "vietnam-duo", "name": "Vietnam: Hanoi + Hoi An", "country": "Vietnam", "timeZone": "Asia/Ho_Chi_Minh", "domestic": False,
     "tags": ["food", "culture", "nature", "adventure", "beach"], "passportMonths": 6, "visaKey": "vietnam", "visaLeadDays": 7, "visaWaivedBy": [],
     "officialUrl": "https://evisa.gov.vn/", "reviewedAt": "2026-10-25", "roomCapacity": 2, "insurance": 1800, "entryAllowance": 2200,
     "stops": [
         {"id": "hanoi", "name": "Hanoi & Ha Long", "weight": 1, "fromDestination": "hanoi"},
         {"id": "hoi-an", "name": "Hoi An & Da Nang", "weight": 1, "roomNight": 3200, "vehicleCapacity": 4, "vehicleDay": 2800, "foodDay": 1200, "activities": [
             act("hoi-an-town", "Hoi An ancient town and lanterns", ["culture", "food"], 180, "Hoi An", 800),
             act("marble-mountains", "Marble Mountains caves", ["nature", "culture"], 150, "Da Nang", 600),
             act("my-khe", "My Khe beach afternoon", ["beach"], 180, "Da Nang", 300),
             act("basket-boat", "Coconut forest basket boats", ["adventure", "nature"], 120, "Cam Thanh", 1200)]}],
     "transfers": [{"title": "Fly Hanoi → Da Nang", "mode": "flight", "costPerPerson": 4000, "durationMinutes": 240}]},
    {"id": "uae-duo", "name": "UAE: Dubai + Abu Dhabi", "country": "United Arab Emirates", "timeZone": "Asia/Dubai", "domestic": False,
     "tags": ["food", "shopping", "nightlife", "adventure", "culture", "art"], "passportMonths": 6, "visaKey": "uae", "visaLeadDays": 7, "visaWaivedBy": ["us", "uk", "schengen"],
     "officialUrl": "https://u.ae/en/information-and-services/visa-and-emirates-id/tourist-visas", "reviewedAt": "2026-10-25", "roomCapacity": 2, "insurance": 1800, "entryAllowance": 7500,
     "stops": [
         {"id": "dubai", "name": "Dubai", "weight": 2, "fromDestination": "dubai"},
         {"id": "abu-dhabi", "name": "Abu Dhabi", "weight": 1, "roomNight": 7500, "vehicleCapacity": 6, "vehicleDay": 5500, "foodDay": 2400, "activities": [
             act("grand-mosque", "Sheikh Zayed Grand Mosque", ["culture"], 150, "Abu Dhabi", 200),
             act("louvre-ad", "Louvre Abu Dhabi", ["art", "culture"], 180, "Saadiyat", 1400),
             act("yas", "Yas Island theme park", ["adventure"], 210, "Yas Island", 6000),
             act("corniche", "Corniche beach walk", ["beach", "nature"], 120, "Corniche", 300)]}],
     "transfers": [{"title": "Drive Dubai → Abu Dhabi", "mode": "road", "costPerPerson": 600, "durationMinutes": 150}]},
    {"id": "kerala-trio", "name": "Kerala: Kochi + Munnar + Alleppey", "country": "India", "timeZone": "Asia/Kolkata", "domestic": True,
     "tags": ["nature", "culture", "food", "adventure"], "passportMonths": 0, "visaKey": None, "visaLeadDays": None, "visaWaivedBy": [],
     "officialUrl": "https://www.keralatourism.org/", "reviewedAt": "2026-10-25", "roomCapacity": 2, "insurance": 500, "entryAllowance": 0,
     "stops": [
         {"id": "kochi", "name": "Kochi", "weight": 1, "roomNight": 3500, "vehicleCapacity": 4, "vehicleDay": 2500, "foodDay": 1200, "activities": [
             act("fort-kochi", "Fort Kochi heritage walk", ["culture", "food"], 150, "Fort Kochi", 300),
             act("kathakali", "Kathakali performance", ["culture", "art"], 120, "Fort Kochi", 500)]},
         {"id": "munnar", "name": "Munnar", "weight": 2, "roomNight": 3800, "vehicleCapacity": 6, "vehicleDay": 3500, "foodDay": 1100, "activities": [
             act("tea-gardens", "Tea plantation walk and museum", ["nature"], 180, "Munnar", 400),
             act("eravikulam", "Eravikulam National Park", ["nature", "adventure"], 180, "Rajamalai", 500),
             act("top-station", "Top Station viewpoint", ["nature"], 210, "Top Station", 300)]},
         {"id": "alleppey", "name": "Alleppey", "weight": 1, "roomNight": 6000, "vehicleCapacity": 4, "vehicleDay": 2000, "foodDay": 1200, "activities": [
             act("backwaters", "Backwater houseboat cruise", ["nature"], 210, "Alleppey", 1500),
             act("kayak", "Village canal kayaking", ["adventure", "nature"], 150, "Kainakary", 900)]}],
     "transfers": [{"title": "Drive Kochi → Munnar", "mode": "road", "costPerPerson": 800, "durationMinutes": 240},
                   {"title": "Drive Munnar → Alleppey", "mode": "road", "costPerPerson": 800, "durationMinutes": 240}]},
    {"id": "rajasthan-duo", "name": "Rajasthan: Jaipur + Udaipur", "country": "India", "timeZone": "Asia/Kolkata", "domestic": True,
     "tags": ["culture", "shopping", "food", "nature", "art"], "passportMonths": 0, "visaKey": None, "visaLeadDays": None, "visaWaivedBy": [],
     "officialUrl": "https://www.tourism.rajasthan.gov.in/", "reviewedAt": "2026-10-25", "roomCapacity": 2, "insurance": 500, "entryAllowance": 0,
     "stops": [
         {"id": "jaipur", "name": "Jaipur", "weight": 1, "roomNight": 3500, "vehicleCapacity": 4, "vehicleDay": 2800, "foodDay": 1200, "activities": [
             act("amber-fort", "Amber Fort", ["culture"], 180, "Amer", 500),
             act("city-palace-jaipur", "City Palace and Hawa Mahal", ["culture", "shopping"], 180, "Pink City", 700),
             act("bazaar-food", "Johari Bazaar food and shopping", ["food", "shopping"], 150, "Johari Bazaar", 600)]},
         {"id": "udaipur", "name": "Udaipur", "weight": 1, "roomNight": 4200, "vehicleCapacity": 4, "vehicleDay": 2800, "foodDay": 1300, "activities": [
             act("city-palace-udaipur", "City Palace Udaipur", ["culture", "art"], 180, "Old City", 700),
             act("pichola", "Lake Pichola boat ride", ["nature"], 120, "Lake Pichola", 800),
             act("sajjangarh", "Sajjangarh sunset", ["nature"], 120, "Sajjangarh", 300)]}],
     "transfers": [{"title": "Train or drive Jaipur → Udaipur", "mode": "road", "costPerPerson": 1500, "durationMinutes": 240}]},
]

# Open-jaw return fares per traveller from each departure city.
FARE_FROM = {  # route id -> (base destination id to derive from, uplift) or explicit table
    "thailand-duo": ("bangkok", 3000), "vietnam-duo": ("hanoi", 3000), "uae-duo": ("dubai", 0),
}
EXPLICIT = {
    "kerala-trio": {"Delhi": 14000, "Mumbai": 9000, "Bengaluru": 6000, "Hyderabad": 8000, "Chennai": 6000, "Kolkata": 14000, "Pune": 9000,
                    "Ahmedabad": 11000, "Kochi": 1500, "Jaipur": 14000, "Goa": 9000, "Lucknow": 15000, "Chandigarh": 16000},
    "rajasthan-duo": {"Delhi": 7000, "Mumbai": 10000, "Bengaluru": 14000, "Hyderabad": 12000, "Chennai": 15000, "Kolkata": 14000, "Pune": 11000,
                      "Ahmedabad": 6000, "Kochi": 17000, "Jaipur": 3500, "Goa": 13000, "Lucknow": 10000, "Chandigarh": 9000},
}

known = {d["id"] for d in seeds["destinations"]}
for route in ROUTES:
    if route["id"] in known:
        continue
    assert len(route["transfers"]) == len(route["stops"]) - 1, route["id"]
    for stop in route["stops"]:
        for a in stop.get("activities", []):
            assert a["durationMinutes"] <= 210, a["id"]
    seeds["destinations"].append(route)
for city, fares in seeds["departureCities"].items():
    for route_id, (base, uplift) in FARE_FROM.items():
        fares[route_id] = fares[base] + uplift
    for route_id, table in EXPLICIT.items():
        fares[route_id] = table[city]

json.dump(seeds, open(path, "w"), indent=2, ensure_ascii=False)
open(path, "a").write("\n")
print(f"version {seeds['version']}: {len(seeds['destinations'])} trip options "
      f"({sum(1 for d in seeds['destinations'] if d.get('stops'))} multi-city), {len(seeds['departureCities'])} departure cities")
