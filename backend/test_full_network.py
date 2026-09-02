import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:5000"

def get(path):
    url = f"{BASE_URL}{path}"
    with urllib.request.urlopen(url, timeout=5) as resp:
        return json.loads(resp.read().decode("utf-8"))

def post(path, data):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("--- Testing Live Endpoints on http://127.0.0.1:5000 ---")

# 1. Status
status = get("/api/status")
print(f"[OK] Status: {status.get('version')} (live={status.get('data', {}).get('is_live')})")

# 2. Demand Forecast
df = get("/api/demand-forecast?commodity=Tomato&location=Ahmedabad")
print(f"[OK] Demand Forecast: {df.get('success')} (7-day total = {df['data']['summary']['predicted_weekly_demand_kg']:,} kg)")

# 3. Demand Heatmap
dh = get("/api/demand-heatmap?commodity=Tomato")
print(f"[OK] Demand Heatmap: {dh.get('success')} ({dh['data']['total_active_regions']} regions, {dh['data']['high_demand_count']} HIGH demand)")

# 4. Sellability Score
ss = get("/api/sellability-score?crop=Tomato&quantity=500&location=Sanand&shelf_life=5")
print(f"[OK] Sellability Score: {ss.get('success')} ({ss['data']['sellability_score']}% - {ss['data']['grade']})")

# 5. Smart Match
sm = post("/api/smart-match", {
    "commodity": "Tomato",
    "quantity_kg": 500,
    "asking_price_kg": 22.0,
    "location": "Sanand, Ahmedabad"
})
print(f"[OK] Smart Match: {sm.get('success')} (fulfillment={sm['data']['fulfillment_rate_pct']}%, matched {len(sm['data']['allocations'])} buyers, revenue=Rs {sm['data']['total_revenue_inr']:,.0f})")

# 6. Route Optimize (Shared Vehicle CVRP)
ro = post("/api/route-optimize", {
    "vehicle_capacity_kg": 1000,
    "cost_per_km": 24.0
})
print(f"[OK] Route Optimize: {ro.get('success')} (saved={ro['data']['metrics']['distance_saved_km']} km / {ro['data']['metrics']['distance_saved_pct']}%, cost saved=Rs {ro['data']['metrics']['cost_saved_inr']}, co2={ro['data']['metrics']['co2_saved_kg']} kg)")

# 7. Bulk Demands
bd = get("/api/bulk-demands")
print(f"[OK] Bulk Demands: {bd.get('success')} ({bd.get('count')} institutional open demands)")

# 8. Community Pools
cp = get("/api/community-pools")
print(f"[OK] Community Pools: {cp.get('success')} ({cp.get('count')} society pools)")

# 9. Waste Prevention
wp = get("/api/waste-prevention")
print(f"[OK] Waste Prevention: {wp.get('success')} ({wp['data']['total_perishable_lots_at_risk']} lots at risk, {wp['data']['total_at_risk_kg']} kg)")

# 10. Traceability Batch
tr = get("/api/traceability/1")
print(f"[OK] Farm-to-Fork Trace: {tr.get('success')} (batch={tr['data']['batch_id']}, {len(tr['data']['timeline'])} verified steps)")

# 11. Impact Metrics
im = get("/api/impact-metrics")
print(f"[OK] Impact Metrics: {im.get('success')} (middlemen {im['data']['summary']['middlemen_reduced']['traditional']}->{im['data']['summary']['middlemen_reduced']['nexus']}, farmer gain=+{im['data']['summary']['farmer_net_revenue_increase_pct']}%)")

# 12. Real Dataset Locations
locs = get("/api/locations")
print(f"[OK] Real Locations: {locs.get('success')} ({locs['data']['total_states']} states, {locs['data']['total_districts']} districts, {locs['data']['total_markets']} mandis)")

print("\n[SUCCESS] ALL 12 ENDPOINTS TESTED SUCCESSFULLY AND RETURNED 200 OK WITH VALID JSON!")
