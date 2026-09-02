import urllib.request, json

url = 'http://localhost:5000/api/compare-mandis?crop=Onion&lat=21.5222&lng=70.4579'
with urllib.request.urlopen(url, timeout=5) as res:
    data = json.loads(res.read().decode('utf-8'))
    print("Farmer Location:", data['data']['farmer_location'])
    print("Best Mandi:", data['data']['best_mandi'])
    print("\nRanked Mandis:")
    for m in data['data']['comparison'][:8]:
        print(f"  {m['market']} ({m['district']}, {m['state']}) | Distance: {m['distance_km']} km | Mandi Price: Rs {m['mandi_price_kg']}/kg | Freight: Rs {m['transport_cost_per_kg']}/kg | Net Price: Rs {m['net_price_kg']}/kg")
