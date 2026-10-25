"""Make Fermat's seed manifest work for any country's group.

1. Adds countryCode (ISO-3166 alpha-2) and city-centre lat/lon to every existing destination (on each stop for routes).
2. Appends curated global destinations (US domestic options for a US group, plus Mexico, Portugal and Japan), each with
   costCurrency so costs stay in the currency they were researched in; the engine converts with src/lib/geo/fx.json.
   They omit visaLeadDays and entryAllowance on purpose: those come from src/lib/geo/visaRules.json per passport.
3. Records defaultShortlists: India-home trips keep exactly the original 13 options (identical behaviour); other home
   countries see the whole catalog unless the trip passes its own destinationIds.

Costs are illustrative mid-range estimates (hotel room for two, local transport per vehicle per day, food per person per
day, activity per person), reviewed 2026-10-25. Idempotent.

Usage: python3 -I add_global_destinations.py <path to groupTripSeeds.v1.json>
"""
import json
import sys

path = sys.argv[1]
seeds = json.load(open(path))
seeds["version"] = "2026.10.4"

COORDS = {
    # id: (countryCode, lat, lon) of the city centre
    "bangkok": ("TH", 13.7563, 100.5018),
    "dubai": ("AE", 25.2048, 55.2708),
    "paris": ("FR", 48.8566, 2.3522),
    "bali": ("ID", -8.6500, 115.2167),
    "singapore": ("SG", 1.3521, 103.8198),
    "hanoi": ("VN", 21.0278, 105.8342),
    "goa": ("IN", 15.4909, 73.8278),
    "manali": ("IN", 32.2432, 77.1892),
}
ROUTE_COUNTRY = {"thailand-duo": "TH", "vietnam-duo": "VN", "uae-duo": "AE", "kerala-trio": "IN", "rajasthan-duo": "IN"}
STOP_COORDS = {
    "bangkok": (13.7563, 100.5018), "phuket": (7.8804, 98.3923), "hanoi": (21.0278, 105.8342), "hoi-an": (15.8801, 108.3380),
    "dubai": (25.2048, 55.2708), "abu-dhabi": (24.4539, 54.3773), "kochi": (9.9312, 76.2673), "munnar": (10.0889, 77.0595),
    "alleppey": (9.4981, 76.3388), "jaipur": (26.9124, 75.7873), "udaipur": (24.5854, 73.7125),
}


def act(id, title, tags, minutes, location, cost):
    return {"id": id, "title": title, "tags": tags, "durationMinutes": minutes, "location": location, "costPerPerson": cost}


GLOBAL = [
    {"id": "new-york", "name": "New York", "country": "United States", "countryCode": "US", "lat": 40.7128, "lon": -74.0060,
     "timeZone": "America/New_York", "costCurrency": "USD", "tags": ["food", "culture", "art", "nightlife", "shopping"],
     "passportMonths": 6, "visaKey": "us", "visaWaivedBy": [],
     "officialUrl": "https://travel.state.gov/content/travel/en/us-visas/tourism-visit.html", "reviewedAt": "2026-10-25",
     "roomCapacity": 2, "roomNight": 320, "vehicleCapacity": 4, "vehicleDay": 120, "foodDay": 85, "insurance": 25,
     "activities": [
         act("liberty-ellis", "Statue of Liberty and Ellis Island ferry", ["culture"], 210, "Battery Park", 25),
         act("met", "The Met museum", ["art", "culture"], 180, "Upper East Side", 30),
         act("brooklyn-food", "Brooklyn food walk", ["food"], 180, "DUMBO and Williamsburg", 90),
         act("broadway", "Broadway show", ["nightlife", "art"], 180, "Theater District", 150),
         act("high-line", "High Line and Chelsea Market", ["shopping", "food"], 150, "Chelsea", 20),
     ], "source": "curated", "attribution": "Fermat curated estimate"},
    {"id": "miami", "name": "Miami", "country": "United States", "countryCode": "US", "lat": 25.7617, "lon": -80.1918,
     "timeZone": "America/New_York", "costCurrency": "USD", "tags": ["beach", "nightlife", "food", "art", "nature"],
     "passportMonths": 6, "visaKey": "us", "visaWaivedBy": [],
     "officialUrl": "https://travel.state.gov/content/travel/en/us-visas/tourism-visit.html", "reviewedAt": "2026-10-25",
     "roomCapacity": 2, "roomNight": 260, "vehicleCapacity": 4, "vehicleDay": 110, "foodDay": 75, "insurance": 25,
     "activities": [
         act("everglades", "Everglades airboat ride", ["nature", "adventure"], 210, "Everglades", 45),
         act("wynwood", "Wynwood Walls art walk", ["art", "culture"], 150, "Wynwood", 35),
         act("little-havana", "Little Havana food tour", ["food", "culture"], 180, "Little Havana", 75),
         act("south-beach", "South Beach day and Ocean Drive evening", ["beach", "nightlife"], 180, "South Beach", 30),
         act("key-biscayne", "Key Biscayne kayak", ["beach", "adventure"], 150, "Key Biscayne", 50),
     ], "source": "curated", "attribution": "Fermat curated estimate"},
    {"id": "new-orleans", "name": "New Orleans", "country": "United States", "countryCode": "US", "lat": 29.9511, "lon": -90.0715,
     "timeZone": "America/Chicago", "costCurrency": "USD", "tags": ["food", "nightlife", "culture", "art", "nature"],
     "passportMonths": 6, "visaKey": "us", "visaWaivedBy": [],
     "officialUrl": "https://travel.state.gov/content/travel/en/us-visas/tourism-visit.html", "reviewedAt": "2026-10-25",
     "roomCapacity": 2, "roomNight": 210, "vehicleCapacity": 4, "vehicleDay": 90, "foodDay": 70, "insurance": 25,
     "activities": [
         act("french-quarter", "French Quarter walking tour", ["culture"], 150, "French Quarter", 25),
         act("cajun-food", "Creole and Cajun food tour", ["food"], 180, "French Quarter", 80),
         act("swamp", "Bayou swamp tour", ["nature", "adventure"], 210, "Jean Lafitte", 60),
         act("frenchmen-jazz", "Live jazz on Frenchmen Street", ["nightlife", "art"], 180, "Marigny", 40),
         act("garden-district", "Garden District and cemetery walk", ["culture", "art"], 150, "Garden District", 30),
     ], "source": "curated", "attribution": "Fermat curated estimate"},
    {"id": "cancun", "name": "Cancún", "country": "Mexico", "countryCode": "MX", "lat": 21.1619, "lon": -86.8515,
     "timeZone": "America/Cancun", "costCurrency": "MXN", "tags": ["beach", "nature", "adventure", "culture", "nightlife"],
     "passportMonths": 6, "visaKey": None, "visaWaivedBy": ["us", "uk", "schengen"],
     "officialUrl": "https://www.inm.gob.mx/", "reviewedAt": "2026-10-25",
     "roomCapacity": 2, "roomNight": 3200, "vehicleCapacity": 4, "vehicleDay": 1800, "foodDay": 1100, "insurance": 450,
     "activities": [
         act("chichen-itza", "Chichén Itzá day trip", ["culture", "adventure"], 210, "Yucatán", 1900),
         act("isla-mujeres", "Isla Mujeres catamaran", ["beach", "nature"], 210, "Isla Mujeres", 1500),
         act("cenotes", "Cenote swim", ["nature", "adventure"], 180, "Ruta de los Cenotes", 900),
         act("mercado-28", "Mercado 28 tacos and crafts", ["food", "shopping"], 150, "Downtown Cancún", 500),
         act("hotel-zone-night", "Hotel Zone night out", ["nightlife"], 180, "Zona Hotelera", 800),
     ], "source": "curated", "attribution": "Fermat curated estimate"},
    {"id": "lisbon", "name": "Lisbon", "country": "Portugal", "countryCode": "PT", "lat": 38.7223, "lon": -9.1393,
     "timeZone": "Europe/Lisbon", "costCurrency": "EUR", "tags": ["food", "culture", "art", "nightlife", "nature"],
     "passportMonths": 3, "visaKey": "schengen", "visaWaivedBy": [],
     "officialUrl": "https://vistos.mne.gov.pt/en/", "reviewedAt": "2026-10-25",
     "roomCapacity": 2, "roomNight": 150, "vehicleCapacity": 4, "vehicleDay": 70, "foodDay": 50, "insurance": 22,
     "activities": [
         act("alfama", "Alfama and tram 28", ["culture"], 150, "Alfama", 15),
         act("belem", "Belém tower and monastery", ["culture", "art"], 180, "Belém", 25),
         act("sintra", "Sintra palaces day trip", ["culture", "nature"], 210, "Sintra", 45),
         act("time-out-food", "Time Out Market food tasting", ["food"], 150, "Cais do Sodré", 40),
         act("bairro-alto", "Fado and Bairro Alto evening", ["nightlife", "art"], 180, "Bairro Alto", 35),
     ], "source": "curated", "attribution": "Fermat curated estimate"},
    {"id": "tokyo", "name": "Tokyo", "country": "Japan", "countryCode": "JP", "lat": 35.6762, "lon": 139.6503,
     "timeZone": "Asia/Tokyo", "costCurrency": "JPY", "tags": ["food", "culture", "art", "shopping", "nightlife", "nature"],
     "passportMonths": 0, "visaKey": None, "visaWaivedBy": [],
     "officialUrl": "https://www.mofa.go.jp/j_info/visit/visa/index.html", "reviewedAt": "2026-10-25",
     "roomCapacity": 2, "roomNight": 22000, "vehicleCapacity": 4, "vehicleDay": 6000, "foodDay": 6000, "insurance": 3000,
     "activities": [
         act("asakusa", "Asakusa and Senso-ji temple", ["culture"], 150, "Asakusa", 2000),
         act("teamlab", "teamLab digital art museum", ["art"], 150, "Toyosu", 4000),
         act("tsukiji", "Tsukiji outer market food walk", ["food"], 150, "Tsukiji", 6000),
         act("shibuya-night", "Shibuya and Shinjuku night walk", ["nightlife", "shopping"], 180, "Shibuya", 4000),
         act("takao", "Mount Takao hike", ["nature", "adventure"], 210, "Hachioji", 5000),
     ], "source": "curated", "attribution": "Fermat curated estimate"},
]

for dest in seeds["destinations"]:
    if dest["id"] in COORDS:
        code, lat, lon = COORDS[dest["id"]]
        dest.update({"countryCode": code, "lat": lat, "lon": lon})
    elif dest["id"] in ROUTE_COUNTRY:
        dest["countryCode"] = ROUTE_COUNTRY[dest["id"]]
        for stop in dest["stops"]:
            stop["lat"], stop["lon"] = STOP_COORDS[stop["id"]]
    dest.setdefault("source", "curated")

legacy = [d["id"] for d in seeds["destinations"] if d.get("source") == "curated" and "costCurrency" not in d]
existing = {d["id"] for d in seeds["destinations"]}
seeds["destinations"].extend(d for d in GLOBAL if d["id"] not in existing)
seeds["defaultShortlists"] = {
    "note": "Destinations offered to a trip by home country. Missing home countries see the whole catalog; a trip may pass destinationIds.",
    "IN": seeds.get("defaultShortlists", {}).get("IN") or legacy[:13],
}
seeds["curatedVisaPassport"] = "IN"

json.dump(seeds, open(path, "w"), indent=2, ensure_ascii=False)
print("destinations:", len(seeds["destinations"]), "IN shortlist:", len(seeds["defaultShortlists"]["IN"]))
