import json, math

with open('backend/data/mandi_cache.json', 'r', encoding='utf-8') as f:
    cache = json.load(f)

records = cache.get('records', [])
onion_records = [r for r in records if r.get('commodity', '').lower() == 'onion']
print('Total Onion reporting mandis today:', len(onion_records))

# State centroids
state_centroids = {
    'gujarat': (22.5, 71.5),
    'maharashtra': (19.0, 75.5),
    'rajasthan': (26.5, 74.0),
    'madhya pradesh': (23.0, 77.5),
    'punjab': (31.0, 75.4),
    'haryana': (29.2, 76.3),
    'keralam': (10.5, 76.2),
    'kerala': (10.5, 76.2),
    'tamil nadu': (11.0, 78.5),
    'karnataka': (14.0, 75.8),
    'odisha': (20.5, 84.5),
    'uttar pradesh': (27.0, 80.5),
    'west bengal': (23.0, 87.8)
}

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return round(R * c * 1.25, 1)

junagadh_lat, junagadh_lng = 21.5222, 70.4579

for r in onion_records[:8]:
    state = r.get('state', '').lower()
    c = state_centroids.get(state, (20.0, 75.0))
    d = haversine(junagadh_lat, junagadh_lng, c[0], c[1])
    print(f"Market: {r.get('market')} ({r.get('state')}) -> Distance: {d} km")
