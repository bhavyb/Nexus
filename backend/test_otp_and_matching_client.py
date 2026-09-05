from app import app
import json
import sys

client = app.test_client()

print("--- Testing Two-Sided OTP Verification & Dynamic Matching (Test Client) ---")

# 1. Create a delivery
res = client.post("/api/deliveries", json={
    "crop": "Tomato",
    "quantity_kg": 80,
    "farmer_name": "Ramesh Patel",
    "buyer_name": "Surat Fresh Mart",
    "pickup_location": "Gondal, Rajkot",
    "destination": "Surat"
})
assert res.status_code == 201, f"Create failed: {res.data}"
data = json.loads(res.data.decode("utf-8"))
assert data.get("success"), f"Create delivery failed: {data}"
delivery = data["delivery"]
ref = delivery.get("tracking_reference") or delivery.get("reference")
pickup_otp = delivery["pickup_otp"]
delivery_otp = delivery["delivery_otp"]
print(f"[OK] Delivery Created: {ref} (Pickup OTP: {pickup_otp}, Delivery OTP: {delivery_otp})")

# 2. Farmer view: sees pickup_otp, delivery_otp is redacted
res = client.get(f"/api/deliveries/{ref}?role=farmer")
assert res.status_code == 200
farmer_data = json.loads(res.data.decode("utf-8"))["delivery"]
assert farmer_data.get("pickup_otp") == pickup_otp, "Farmer must see pickup_otp"
assert not farmer_data.get("delivery_otp"), "Farmer must NOT see delivery_otp"
print("[OK] Farmer View Privacy: Pickup OTP visible, Delivery OTP redacted")

# 3. Customer view: sees delivery_otp, pickup_otp is redacted
res = client.get(f"/api/deliveries/{ref}?role=customer")
assert res.status_code == 200
customer_data = json.loads(res.data.decode("utf-8"))["delivery"]
assert customer_data.get("delivery_otp") == delivery_otp, "Customer must see delivery_otp"
assert not customer_data.get("pickup_otp"), "Customer must NOT see pickup_otp"
print("[OK] Customer View Privacy: Delivery OTP visible, Pickup OTP redacted")

# 3b. Logistics / Driver view: CANNOT see pickup_otp OR delivery_otp!
res_driver = client.get(f"/api/deliveries/{ref}?role=logistics")
assert res_driver.status_code == 200
driver_data = json.loads(res_driver.data.decode("utf-8"))["delivery"]
assert not driver_data.get("pickup_otp"), "Driver must NOT see pickup_otp"
assert not driver_data.get("delivery_otp"), "Driver must NOT see delivery_otp"
assert not driver_data.get("demo_pickup_otp"), "Driver must NOT have demo_pickup_otp"
assert not driver_data.get("demo_delivery_otp"), "Driver must NOT have demo_delivery_otp"

res_driver_list = client.get(f"/api/deliveries?role=logistics")
assert res_driver_list.status_code == 200
driver_deliveries = json.loads(res_driver_list.data.decode("utf-8"))["deliveries"]
for d in driver_deliveries:
    assert not d.get("pickup_otp"), "Driver deliveries list must NOT expose pickup_otp"
    assert not d.get("delivery_otp"), "Driver deliveries list must NOT expose delivery_otp"
    assert not d.get("demo_pickup_otp"), "Driver deliveries list must NOT have demo_pickup_otp"
    assert not d.get("demo_delivery_otp"), "Driver deliveries list must NOT have demo_delivery_otp"
print("[OK] Logistics / Driver View Privacy: BOTH Pickup & Delivery OTPs completely hidden from Driver")

# 4. Driver verifies pickup with WRONG OTP
res = client.post(f"/api/deliveries/{ref}/verify-pickup", json={"otp": "0000"})
fail_pickup = json.loads(res.data.decode("utf-8"))
assert not fail_pickup.get("success"), "Wrong OTP should be rejected"
print("[OK] Invalid OTP Rejected")

# 5. Driver verifies pickup with CORRECT OTP
res = client.post(f"/api/deliveries/{ref}/verify-pickup", json={"otp": pickup_otp})
assert res.status_code == 200
ok_pickup = json.loads(res.data.decode("utf-8"))
assert ok_pickup.get("success"), f"Valid pickup OTP failed: {ok_pickup}"
print(f"[OK] Driver Pickup Verification: {ok_pickup.get('message')}")

# 6. Driver verifies delivery with CORRECT OTP
res = client.post(f"/api/deliveries/{ref}/verify-delivery", json={"otp": delivery_otp})
assert res.status_code == 200
ok_dropoff = json.loads(res.data.decode("utf-8"))
assert ok_dropoff.get("success"), f"Valid delivery OTP failed: {ok_dropoff}"
print(f"[OK] Driver Dropoff Verification: {ok_dropoff.get('message')}")

# 7. Check dynamic matching
res = client.post("/api/logistics/dynamic-match", json={"shipment_weight_kg": 350})
assert res.status_code == 200
match = json.loads(res.data.decode("utf-8"))
assert match.get("success"), f"Dynamic match failed: {match}"
assert match.get("fleet_count", 0) >= 4
top_v = match["ranked_fleet"][0]
print(f"[OK] Dynamic Fleet Match: {top_v.get('company')} ({top_v.get('vehicle_type')}) ranked #1 (Score: {top_v.get('match_score')}%)")

# 8. Check AI best farmer endpoint
res = client.post("/api/smart-match/best-farmer", json={
    "commodity": "Tomato",
    "quantity_kg": 100,
    "budget_kg": 28.0,
    "delivery_city": "Ahmedabad"
})
assert res.status_code == 200
bf = json.loads(res.data.decode("utf-8"))
assert bf.get("success"), f"Best farmer match failed: {bf}"
best_farmer = bf.get("best_match")
assert best_farmer is not None
print(f"[OK] AI Best Farmer Match: {best_farmer['farmer_name']} ({best_farmer['match_score']}% Match) - Saves Rs {best_farmer['savings_vs_mandi_kg']}/kg")

print("\n>>> ALL 8 VERIFICATION CHECKS PASSED WITH 100% SUCCESS! <<<")
sys.exit(0)
