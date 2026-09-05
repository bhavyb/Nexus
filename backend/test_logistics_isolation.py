from app import app
import json
import sys

client = app.test_client()

print("--- Testing Logistics Driver-Exclusive Order Isolation ---")

# 1. Create a new test order
res = client.post("/api/deliveries", json={
    "crop": "Potato",
    "quantity_kg": 150,
    "farmer_name": "Kishan Patel",
    "buyer_name": "Ahmedabad Grand Hotel",
    "pickup_location": "Sanand, Ahmedabad",
    "destination": "SG Highway, Ahmedabad"
})
assert res.status_code == 201, f"Failed: {res.data}"
data = json.loads(res.data.decode("utf-8"))
ref = data["delivery"]["reference"]
print(f"[OK] Created Order: {ref}")

# 2. Both Driver A and Driver B inspect available dispatches
res_a = client.get(f"/api/deliveries?role=logistics&stakeholder=Driver%20Ramesh")
assert res_a.status_code == 200
list_a = json.loads(res_a.data.decode("utf-8"))["deliveries"]
refs_a = [d["reference"] for d in list_a]
assert ref in refs_a, "Driver Ramesh should see unassigned order"

res_b = client.get(f"/api/deliveries?role=logistics&stakeholder=Driver%20Sardar")
assert res_b.status_code == 200
list_b = json.loads(res_b.data.decode("utf-8"))["deliveries"]
refs_b = [d["reference"] for d in list_b]
assert ref in refs_b, "Driver Sardar should see unassigned order"
print("[OK] Both Driver Ramesh & Driver Sardar see the open unaccepted order")

# 3. Driver Ramesh ACCEPTS the order
res_accept = client.post(f"/api/deliveries/{ref}/accept", json={
    "logistics_name": "Driver Ramesh",
    "vehicle_number": "GJ-01-AB-1234",
    "current_location": "Sanand bypass"
})
assert res_accept.status_code == 200
accepted_data = json.loads(res_accept.data.decode("utf-8"))
assert accepted_data["delivery"]["status"] == "Accepted"
assert accepted_data["delivery"]["logistics_name"] == "Driver Ramesh"
print("[OK] Order successfully claimed and accepted by Driver Ramesh")

# 4. Driver Ramesh re-checks deliveries
res_a_after = client.get(f"/api/deliveries?role=logistics&stakeholder=Driver%20Ramesh")
list_a_after = json.loads(res_a_after.data.decode("utf-8"))["deliveries"]
refs_a_after = [d["reference"] for d in list_a_after]
assert ref in refs_a_after, "Order must remain visible to Driver Ramesh who accepted it"
print("[OK] Driver Ramesh STILL SEES the order in his active dispatches")

# 5. Driver Sardar re-checks deliveries -> MUST NOT SEE IT!
res_b_after = client.get(f"/api/deliveries?role=logistics&stakeholder=Driver%20Sardar")
list_b_after = json.loads(res_b_after.data.decode("utf-8"))["deliveries"]
refs_b_after = [d["reference"] for d in list_b_after]
assert ref not in refs_b_after, "CRITICAL: Order MUST NOT be visible to Driver Sardar!"
print("[OK] Driver Sardar CANNOT see the order anymore (successfully isolated!)")

# 6. Another Driver C checks deliveries -> MUST NOT SEE IT!
res_c_after = client.get(f"/api/deliveries?role=logistics&stakeholder=Driver%20Jayesh")
list_c_after = json.loads(res_c_after.data.decode("utf-8"))["deliveries"]
refs_c_after = [d["reference"] for d in list_c_after]
assert ref not in refs_c_after, "CRITICAL: Order MUST NOT be visible to Driver Jayesh!"
print("[OK] Driver Jayesh CANNOT see the order either (hidden from other logistics)")

# 7. Farmer still sees it
res_farmer = client.get(f"/api/deliveries?role=farmer&stakeholder=Kishan%20Patel")
list_farmer = json.loads(res_farmer.data.decode("utf-8"))["deliveries"]
refs_farmer = [d["reference"] for d in list_farmer]
assert ref in refs_farmer, "Farmer must still see his own order"
print("[OK] Farmer Kishan Patel still tracks the order (with pickup OTP)")

# 8. Buyer still sees it
res_buyer = client.get(f"/api/deliveries?role=customer&stakeholder=Ahmedabad%20Grand%20Hotel")
list_buyer = json.loads(res_buyer.data.decode("utf-8"))["deliveries"]
refs_buyer = [d["reference"] for d in list_buyer]
assert ref in refs_buyer, "Buyer must still see their order"
print("[OK] Buyer Ahmedabad Grand Hotel still tracks the order (with delivery OTP)")

print("\n>>> ALL LOGISTICS ORDER ISOLATION TESTS PASSED WITH 100% SUCCESS! <<<")
sys.exit(0)
