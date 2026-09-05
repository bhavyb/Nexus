import sys
from app import app

def run_tests():
    client = app.test_client()

    print("--- Testing AI Capacitated Route Optimization ---")

    # 1. Test Default SIH Benchmark
    r1 = client.get('/api/route-optimize')
    assert r1.status_code == 200, f"GET /api/route-optimize returned {r1.status_code}"
    d1 = r1.get_json()['data']
    comp = d1['route_comparison']
    assert comp['original_route_cost_inr'] == 8200, f"Expected 8200, got {comp['original_route_cost_inr']}"
    assert comp['optimized_route_cost_inr'] == 6900, f"Expected 6900, got {comp['optimized_route_cost_inr']}"
    assert comp['estimated_saving_inr'] == 1300, f"Expected 1300, got {comp['estimated_saving_inr']}"
    assert d1['capacity_constraint']['is_compliant'] is True, "Expected capacity compliant"
    assert len(d1['route_stops']) == 5, f"Expected 5 stops, got {len(d1['route_stops'])}"
    assert d1['net_realization']['net_realization_gain_inr'] == 1300, "Expected 1300 net realization gain"
    print("[OK] Check 1: SIH Benchmark Values (Rs 8,200 vs Rs 6,900 -> Save Rs 1,300) verified!")

    # 2. Test Custom Multi-Farm Pickups and Buyer Destination
    custom_payload = {
        'destination': 'Vadodara Central Agro Hub',
        'vehicle_capacity_kg': 1500,
        'cost_per_km': 25.0,
        'pickups': [
            {'id': 'P1', 'farmer_name': 'Hasmukh Patel', 'location': 'Anand Farmgate', 'load_kg': 400, 'crop': 'Banana', 'price_per_kg': 20},
            {'id': 'P2', 'farmer_name': 'Dineshbhai Shah', 'location': 'Nadiad Rural', 'load_kg': 500, 'crop': 'Papaya', 'price_per_kg': 25}
        ]
    }
    r2 = client.post('/api/route-optimize', json=custom_payload)
    assert r2.status_code == 200, f"POST /api/route-optimize returned {r2.status_code}"
    d2 = r2.get_json()['data']
    assert d2['target_buyer_destination']['name'] == 'Vadodara Central Agro Hub'
    assert d2['capacity_constraint']['total_load_kg'] == 900
    assert d2['capacity_constraint']['is_compliant'] is True
    print("[OK] Check 2: Dynamic Multi-farm pickup and buyer destination verified!")

    # 3. Test Vehicle Capacity Constraint Violation
    overload_payload = {
        'vehicle_capacity_kg': 500,
        'pickups': [
            {'id': 'P1', 'farmer_name': 'Farmer 1', 'location': 'Sanand', 'load_kg': 400, 'crop': 'Tomato', 'price_per_kg': 20},
            {'id': 'P2', 'farmer_name': 'Farmer 2', 'location': 'Bavla', 'load_kg': 350, 'crop': 'Potato', 'price_per_kg': 18}
        ]
    }
    r3 = client.post('/api/route-optimize', json=overload_payload)
    assert r3.status_code == 200, f"POST /api/route-optimize returned {r3.status_code}"
    d3 = r3.get_json()['data']
    assert d3['capacity_constraint']['is_compliant'] is False, "Should be overloaded"
    assert 'EXCEEDED' in d3['capacity_constraint']['status'], "Should flag capacity exceeded"
    print("[OK] Check 3: Vehicle capacity constraint enforcement (Overload Alert) verified!")

    # 4. Multi-farm Cost Sharing and Explanation
    assert len(d1['multi_farm_shared_allocation']) == 3, "Expected 3 farmer cost breakdowns"
    assert len(d1['ai_explanation']) > 50, "Expected non-empty AI rationale"
    print("[OK] Check 4: Multi-farm Cost Sharing Breakdown & AI Rationale verified!")

    print("\n>>> ALL ROUTE OPTIMIZATION CHECKS PASSED WITH 100% SUCCESS! <<<")

if __name__ == "__main__":
    run_tests()
