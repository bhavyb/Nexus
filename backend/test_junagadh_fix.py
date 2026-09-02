import json, math

with open('backend/data/mandi_coordinates.json', 'r', encoding='utf-8') as f:
    MANDI_COORDINATES = json.load(f)

STATE_CENTROIDS = {
    "gujarat": {"lat": 22.2587, "lng": 71.1924},
    "maharashtra": {"lat": 19.7515, "lng": 75.7139},
    "rajasthan": {"lat": 27.0238, "lng": 74.2179},
    "madhya pradesh": {"lat": 22.9734, "lng": 78.6569},
    "punjab": {"lat": 31.1471, "lng": 75.3412},
    "haryana": {"lat": 29.0588, "lng": 76.0856},
    "delhi": {"lat": 28.7041, "lng": 77.1025},
    "uttar pradesh": {"lat": 26.8467, "lng": 80.9462},
    "karnataka": {"lat": 15.3173, "lng": 75.7139},
    "keralam": {"lat": 10.8505, "lng": 76.2711},
    "kerala": {"lat": 10.8505, "lng": 76.2711},
    "tamil nadu": {"lat": 11.1271, "lng": 78.6569},
    "andhra pradesh": {"lat": 15.9129, "lng": 79.7400},
    "telangana": {"lat": 18.1124, "lng": 79.0193},
    "odisha": {"lat": 20.9517, "lng": 85.0985},
    "west bengal": {"lat": 22.9868, "lng": 87.8550},
    "bihar": {"lat": 25.0961, "lng": 85.3131},
    "chhattisgarh": {"lat": 21.2787, "lng": 81.8661},
    "chattisgarh": {"lat": 21.2787, "lng": 81.8661},
    "jharkhand": {"lat": 23.6102, "lng": 85.2799},
    "himachal pradesh": {"lat": 31.1048, "lng": 77.1734},
    "uttarakhand": {"lat": 30.0668, "lng": 79.0193},
    "assam": {"lat": 26.2006, "lng": 92.9376}
}

GUJARAT_DISTRICTS = {
    "junagadh": {"lat": 21.5222, "lng": 70.4579},
    "rajkot": {"lat": 22.3039, "lng": 70.8022},
    "gondal": {"lat": 21.9619, "lng": 70.7933},
    "amreli": {"lat": 21.6032, "lng": 71.2221},
    "bhavnagar": {"lat": 21.7645, "lng": 72.1519},
    "jamnagar": {"lat": 22.4707, "lng": 70.0577},
    "porbandar": {"lat": 21.6417, "lng": 69.6293},
    "morbi": {"lat": 22.8120, "lng": 70.8378},
    "surendranagar": {"lat": 22.7275, "lng": 71.6370},
    "botad": {"lat": 22.1700, "lng": 71.6600},
    "gir somnath": {"lat": 20.9000, "lng": 70.3600},
    "devbhumi dwarka": {"lat": 22.2400, "lng": 68.9600},
    "kachchh": {"lat": 23.2420, "lng": 69.6669},
    "ahmedabad": {"lat": 23.0225, "lng": 72.5714},
    "gandhinagar": {"lat": 23.2156, "lng": 72.6369},
    "mehsana": {"lat": 23.5880, "lng": 72.3693},
    "patan": {"lat": 23.8493, "lng": 72.1266},
    "banaskantha": {"lat": 24.1724, "lng": 72.4346},
    "banaskanth": {"lat": 24.1724, "lng": 72.4346},
    "sabarkantha": {"lat": 23.5977, "lng": 72.9698},
    "aravalli": {"lat": 23.5300, "lng": 73.2700},
    "kheda": {"lat": 22.7500, "lng": 72.6800},
    "anand": {"lat": 22.5645, "lng": 72.9289},
    "vadodara": {"lat": 22.3072, "lng": 73.1812},
    "panchmahal": {"lat": 22.7758, "lng": 73.6149},
    "dahod": {"lat": 22.8373, "lng": 74.2536},
    "mahisagar": {"lat": 23.1700, "lng": 73.5600},
    "chhotaudepur": {"lat": 22.3000, "lng": 74.0100},
    "bharuch": {"lat": 21.7051, "lng": 72.9959},
    "narmada": {"lat": 21.8700, "lng": 73.5000},
    "surat": {"lat": 21.1702, "lng": 72.8311},
    "tapi": {"lat": 21.2500, "lng": 73.5700},
    "navsari": {"lat": 20.9500, "lng": 72.9300},
    "valsad": {"lat": 20.5992, "lng": 72.9342},
    "dang": {"lat": 20.7600, "lng": 73.7000}
}

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return round(R * c * 1.25, 1)

def resolve_mandi_coords(market, district, state):
    m_clean = market.lower().strip()
    d_clean = district.lower().strip()
    s_clean = state.lower().strip()

    # Exact market match
    for k, v in MANDI_COORDINATES.items():
        if k.lower() == m_clean:
            return v['lat'], v['lng'], 'MandiRegistry'

    # Substring match in market name
    for k, v in MANDI_COORDINATES.items():
        if k.lower() in m_clean:
            return v['lat'], v['lng'], f"MandiSubstring:{k}"

    # Gujarat districts
    for k, v in GUJARAT_DISTRICTS.items():
        if k in d_clean or k in m_clean:
            return v['lat'], v['lng'], f"GujaratDistrict:{k}"

    # District match in general registry
    for k, v in MANDI_COORDINATES.items():
        if v.get('district', '').lower() == d_clean:
            return v['lat'], v['lng'], f"DistrictMatch:{k}"

    # State centroid
    for k, v in STATE_CENTROIDS.items():
        if k == s_clean or k in s_clean:
            return v['lat'], v['lng'], f"StateCentroid:{k}"

    return 20.0, 75.0, "IndiaDefault"

# Test for Junagadh origin
junagadh_lat, junagadh_lng = 21.5222, 70.4579

with open('backend/data/mandi_cache.json', 'r', encoding='utf-8') as f:
    cache = json.load(f)

onion_records = [r for r in cache.get('records', []) if r.get('commodity', '').lower() == 'onion']
mandi_dict = {}
for r in onion_records:
    m = r['market']
    if m not in mandi_dict:
        mandi_dict[m] = r

tested = []
for m, r in mandi_dict.items():
    lat, lng, src = resolve_mandi_coords(r['market'], r.get('district', ''), r.get('state', ''))
    dist = haversine_distance(junagadh_lat, junagadh_lng, lat, lng)
    
    # Transport freight (Rs 25/km, 1500 kg load)
    freight_kg = round((dist * 25.0) / 1500.0, 2)
    mandi_price = r['modal_price_kg']
    net_price = round(mandi_price - freight_kg, 2)

    tested.append({
        'market': m,
        'district': r.get('district', ''),
        'state': r.get('state', ''),
        'dist_km': dist,
        'mandi_price': mandi_price,
        'freight_kg': freight_kg,
        'net_price': net_price,
        'source': src
    })

# Filter nearby (within 500 km)
nearby = [x for x in tested if x['dist_km'] <= 500]
nearby.sort(key=lambda x: x['net_price'], reverse=True)

print(f"Total reporting: {len(tested)}, Mandis within 500 km of Junagadh: {len(nearby)}")
print("\n--- TOP MANDIS NEAR JUNAGADH ---")
for x in nearby:
    print(f"{x['market']} ({x['district']}, {x['state']}) | Dist: {x['dist_km']} km | Price: Rs {x['mandi_price']}/kg | Freight: Rs {x['freight_kg']}/kg | NET: Rs {x['net_price']}/kg")
