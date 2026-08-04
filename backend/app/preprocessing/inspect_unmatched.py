import pandas as pd
import requests

df = pd.read_csv("data/processed/feature_table.csv")
unmatched = df[df["municipality"].isna()]
print("Total unmatched:", len(unmatched))

sample = unmatched.sample(10, random_state=1)

for _, row in sample.iterrows():
    resp = requests.get(
        "https://nominatim.openstreetmap.org/reverse",
        params={
            "lat": row["lat"],
            "lon": row["lon"],
            "format": "jsonv2",
            "zoom": 10,
            "addressdetails": 1,
        },
        headers={"User-Agent": "AETHER-mangrove-monitoring/1.0"},
        timeout=10,
    )
    data = resp.json()
    addr = data.get("address", {})
    place = (
        addr.get("municipality")
        or addr.get("city")
        or addr.get("town")
        or addr.get("county")
        or addr.get("state")
        or "NONE"
    )
    print(
        row["zone_id"],
        f"({row['lat']:.4f}, {row['lon']:.4f})",
        "->",
        place,
        "| province:",
        addr.get("state"),
    )