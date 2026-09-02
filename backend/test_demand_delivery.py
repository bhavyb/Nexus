"""
Unit tests for the new AI-Powered Demand-to-Delivery Platform endpoints:
- /api/demand-forecast
- /api/demand-heatmap
- /api/sellability-score
- /api/smart-match
- /api/route-optimize
- /api/bulk-demands
- /api/community-pools
- /api/waste-prevention
- /api/traceability/1
- /api/impact-metrics
"""

import unittest
import json
from app import app

class TestDemandToDeliveryNetwork(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_status(self):
        res = self.client.get("/api/status")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["version"], "2.0-DemandToDelivery")

    def test_demand_forecast(self):
        res = self.client.get("/api/demand-forecast?commodity=Tomato&location=Ahmedabad")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["data"]["forecast"]), 7)
        self.assertIn("recommended_allocation_kg", data["data"]["summary"])

    def test_demand_heatmap(self):
        res = self.client.get("/api/demand-heatmap?commodity=Tomato")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreater(data["data"]["total_active_regions"], 0)
        self.assertIn("demand_level", data["data"]["regions"][0])

    def test_sellability_score(self):
        res = self.client.get("/api/sellability-score?crop=Tomato&quantity=500&location=Sanand&shelf_life=5")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["data"]["sellability_score"], 25)
        self.assertIn("recommended_actions", data["data"])

    def test_smart_match(self):
        payload = {
            "commodity": "Tomato",
            "quantity_kg": 500,
            "asking_price_kg": 22.0,
            "location": "Ahmedabad"
        }
        res = self.client.post("/api/smart-match", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["total_harvest_kg"], 500)
        self.assertGreater(len(data["data"]["allocations"]), 0)

    def test_route_optimize(self):
        res = self.client.post("/api/route-optimize", json={})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("distance_saved_km", data["data"]["metrics"])
        self.assertGreater(len(data["data"]["route_stops"]), 0)

    def test_bulk_demands(self):
        res = self.client.get("/api/bulk-demands")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreater(data["count"], 0)

    def test_community_pools(self):
        res = self.client.get("/api/community-pools")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreater(data["count"], 0)

    def test_waste_prevention(self):
        res = self.client.get("/api/waste-prevention")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])

    def test_traceability(self):
        res = self.client.get("/api/traceability/1")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("timeline", data["data"])

    def test_impact_metrics(self):
        res = self.client.get("/api/impact-metrics")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["summary"]["middlemen_reduced"]["nexus"], 1)

if __name__ == "__main__":
    unittest.main()
