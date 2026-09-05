import urllib.request
import urllib.parse
import json
import sys

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
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode("utf-8"))

print("--- Testing Two-Sided OTP Verification & Dynamic Matching ---")

# 1. Create a delivery
res = post("/api/deliveries", {
    "crop": "Tomato",
    "quantity_kg": 80,
    "farmer_name": "Ramesh Patel",
    "buyer_name": "Surat Fresh Mart",
    "pickup_location": "Gondal, Rajkot",
    "destination": "Surat"
})
assert res.get("success"), f"Create delivery failed: {res}"
delivery = res["delivery"]
ref = delivery.get("tracking_reference") or delivery.get("reference")
pickup_otp = delivery["pickup_otp"]
delivery_otp = delivery["delivery_otp"]
print(f"[OK] Delivery Created: {ref} (Pickup OTP: {pickup_otp}, Delivery OTP: {delivery_otp})")

# 2. Farmer view: sees pickup_otp, delivery_otp is redacted
farmer_view = get(f"/api/deliveries/{ref}?role=farmer")
f_del = farmer_view["delivery"]
assert f_del.get("pickup_otp") == pickup_otp, "Farmer must see pickup_otp"
assert not f_del.get("delivery_otp"), "Farmer must NOT see delivery_otp"
print("[OK] Farmer View Privacy: Pickup OTP visible, Delivery OTP redacted")

# 3. Customer view: sees delivery_otp, pickup_otp is redacted
customer_view = get(f"/api/deliveries/{ref}?role=customer")
c_del = customer_view["delivery"]
assert c_del.get("delivery_otp") == delivery_otp, "Customer must see delivery_otp"
assert not c_del.get("pickup_otp"), "Customer must NOT see pickup_otp"
print("[OK] Customer View Privacy: Delivery OTP visible, Pickup OTP redacted")

# 4. Driver verifies pickup with WRONG OTP
fail_pickup = post(f"/api/deliveries/{ref}/verify-pickup", {"otp": "0000"})
assert not fail_pickup.get("success"), "Wrong OTP should be rejected"
print("[OK] Invalid OTP Rejected")

# 5. Driver verifies pickup with CORRECT OTP
ok_pickup = post(f"/api/deliveries/{ref}/verify-pickup", {"otp": pickup_otp})
assert ok_pickup.get("success"), f"Valid pickup OTP failed: {ok_pickup}"
print(f"[OK] Driver Pickup Verification: {ok_pickup.get('message')}")

# 6. Driver verifies delivery with CORRECT OTP
ok_dropoff = post(f"/api/deliveries/{ref}/verify-delivery", {"otp": delivery_otp})
assert ok_dropoff.get("success"), f"Valid delivery OTP failed: {ok_dropoff}"
print(f"[OK] Driver Dropoff Verification: {ok_dropoff.get('message')}")

# 7. Check dynamic matching
match = post("/api/logistics/dynamic-match", {"shipment_weight_kg": 350})
assert match.get("success"), f"Dynamic match failed: {match}"
assert match.get("fleet_count", 0) >= 4
top_v = match["ranked_fleet"][0]
print(f"[OK] Dynamic Fleet Match: {top_v.get('company')} ({top_v.get('vehicle_type')}) ranked #1 (Score: {top_v.get('match_score')}%)")

# 8. Check AI best farmer endpoint
bf = post("/api/smart-match/best-farmer", {
    "commodity": "Tomato",
    "quantity_kg": 100,
    "budget_kg": 28.0,
    "delivery_city": "Ahmedabad"
})
assert bf.get("success"), f"Best farmer match failed: {bf}"
best_farmer = bf.get("best_match")
assert best_farmer is not None
print(f"[OK] AI Best Farmer Match: {best_farmer['farmer_name']} ({best_farmer['match_score']}% Match) - Saves Rs {best_farmer['savings_vs_mandi_kg']}/kg")

print("\n>>> ALL 8 VERIFICATION CHECKS PASSED WITH 100% SUCCESS! <<<")
