import json
import sqlite3
from app import app
from marketplace_db import create_delivery_assignment, get_db_connection

def run_test():
    client = app.test_client()

    print("--- 1. Creating 2 Dynamic Live Orders in SQLite ---")
    order1 = create_delivery_assignment(
        crop="Tomato",
        quantity_kg=250.0,
        farmer_name="Kishanbhai Patel",
        buyer_name="Ahmedabad Mega Mart",
        pickup_location="Sanand",
        destination="Vastrapur, Ahmedabad"
    )
    order2 = create_delivery_assignment(
        crop="Potato",
        quantity_kg=350.0,
        farmer_name="Jigneshbhai Shah",
        buyer_name="Surat Fresh Distribution",
        pickup_location="Bavla",
        destination="Maninagar, Ahmedabad"
    )

    ref1 = order1["reference"]
    ref2 = order2["reference"]
    otp_p1 = str(order1["pickup_otp"])
    otp_d1 = str(order1["delivery_otp"])
    otp_p2 = str(order2["pickup_otp"])
    otp_d2 = str(order2["delivery_otp"])

    print(f"Created Order 1: {ref1} (Farmer OTP: {otp_p1}, Buyer OTP: {otp_d1})")
    print(f"Created Order 2: {ref2} (Farmer OTP: {otp_p2}, Buyer OTP: {otp_d2})")

    print("\n--- 2. Requesting Dynamic Route Optimization with Selected References ---")
    resp = client.post("/api/route-optimize", json={
        "order_references": [ref1, ref2],
        "vehicle_capacity_kg": 1000.0,
        "cost_per_km": 24.0
    })
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.get_json()["data"]

    stops = data.get("route_sequence") or data.get("route_stops")
    print(f"Total Stops Generated: {len(stops)}")
    for s in stops:
        print(f"  Stop #{s['step']} [{s['type']}]: {s['entity']} at {s['location']} - OTP: {s.get('otp')} (Ref: {s.get('reference')})")

    # Verify candidate vehicles explanation is dynamic
    assert "600 kg" in data["candidate_vehicles"][0]["match_reason"] or "600" in str(data["candidate_vehicles"]), "Expected dynamic weight in vehicle match reason"
    print(f"Vehicle A Explanation: {data['candidate_vehicles'][0]['match_reason']}")
    print(f"Vehicle B Explanation: {data['candidate_vehicles'][1]['match_reason']}")

    # Verify uncoordinated trips count
    assert len(data["uncoordinated_trips"]) == 2, f"Expected 2 baseline trips, got {len(data['uncoordinated_trips'])}"
    print(f"Baseline Uncoordinated Trips: {len(data['uncoordinated_trips'])} vehicles")
    for t in data["uncoordinated_trips"]:
        safe_route = t['route'].encode('ascii', errors='replace').decode('ascii')
        print(f"  {t['vehicle']}: {safe_route} ({t['distance_km']} km, Rs {t['cost_inr']})")

    print("\n--- 3. Testing Real OTP Stop Verification Against SQLite DB ---")
    pickup_stop_1 = next(s for s in stops if s["type"] == "PICKUP" and s.get("reference") == ref1)
    verify_resp1 = client.post("/api/route-optimize/verify-stop", json={
        "stop_id": pickup_stop_1["stop_id"],
        "otp": otp_p1,
        "reference": ref1,
        "stop_type": "pickup",
        "entity": pickup_stop_1["entity"]
    })
    assert verify_resp1.status_code == 200, f"Pickup OTP verification failed: {verify_resp1.get_json()}"
    msg1 = verify_resp1.get_json()['message'].encode('ascii', errors='replace').decode('ascii')
    print(f"Verification 1 Passed: {msg1}")

    # Check DB status
    with get_db_connection() as conn:
        row = conn.execute("SELECT status FROM delivery_updates WHERE reference = ?", (ref1,)).fetchone()
        assert row["status"] == "Picked Up", f"Expected 'Picked Up', got {row['status']}"
        print(f"Database status for {ref1} updated to: {row['status']}")

    delivery_stop_1 = next(s for s in stops if s["type"] == "DELIVERY" and s.get("reference") == ref1)
    verify_resp2 = client.post("/api/route-optimize/verify-stop", json={
        "stop_id": delivery_stop_1["stop_id"],
        "otp": otp_d1,
        "reference": ref1,
        "stop_type": "delivery",
        "entity": delivery_stop_1["entity"]
    })
    assert verify_resp2.status_code == 200, f"Delivery OTP verification failed: {verify_resp2.get_json()}"
    msg2 = verify_resp2.get_json()['message'].encode('ascii', errors='replace').decode('ascii')
    print(f"Verification 2 Passed: {msg2}")

    # Check DB status
    with get_db_connection() as conn:
        row = conn.execute("SELECT status FROM delivery_updates WHERE reference = ?", (ref1,)).fetchone()
        assert row["status"] == "Delivered", f"Expected 'Delivered', got {row['status']}"
        print(f"Database status for {ref1} updated to: {row['status']}")

    print("\n--- 4. Testing Preset Fallback Mode ---")
    preset_resp = client.post("/api/route-optimize", json={"mode": "preset"})
    assert preset_resp.status_code == 200
    preset_data = preset_resp.get_json()["data"]
    assert len(preset_data["route_sequence"]) == 6, f"Expected 6 preset stops, got {len(preset_data['route_sequence'])}"
    print(f"Preset mode verified: {len(preset_data['route_sequence'])} stops")

    print("\nALL DYNAMIC ROUTE OPTIMIZATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_test()
