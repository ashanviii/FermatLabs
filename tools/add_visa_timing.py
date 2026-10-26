"""Add visa lead times (days needed to obtain a visa not already held) and waiver visas to the seeds."""
import json, sys
path = sys.argv[1]; seeds = json.load(open(path))
LEAD = {"bangkok": None, "dubai": 7, "paris": 45, "bali": None, "singapore": 7, "hanoi": 7, "goa": None, "manali": None}
WAIVED_BY = {"dubai": ["us", "uk", "schengen"]}  # UAE visa on arrival for Indians holding these (verify)
for d in seeds["destinations"]:
    d["visaLeadDays"] = LEAD[d["id"]]
    d["visaWaivedBy"] = WAIVED_BY.get(d["id"], [])
seeds["holdableVisas"] = {"uae": "UAE", "schengen": "Schengen", "singapore": "Singapore", "vietnam": "Vietnam", "us": "US", "uk": "UK"}
json.dump(seeds, open(path, "w"), indent=2, ensure_ascii=False); open(path, "a").write("\n"); print("ok")
