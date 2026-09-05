"""
Nexus Automated Test Suite
Verifies data fetcher, caching layer, Prophet forecaster, mandi comparator,
marketplace persistence, and markup anomaly detection.
"""

import unittest
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from app import app
from data_cleaner import clean_mandi_record, clean_mandi_dataset
from data_fetcher import get_distinct_commodities, get_distinct_mandis, get_cache_status
from mandi_comparator import compare_mandis_for_crop, haversine_distance
from markup_detector import analyze_price_markup
from marketplace_db import create_listing, get_listings


class NexusBackendTestCase(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()

    def test_data_cleaner_record(self):
        # Valid record
        raw_valid = {
            "state": "maharashtra",
            "district": "nashik",
            "market": "lasalgaon",
            "commodity": "onion",
            "variety": "red",
            "arrival_date": "03/09/2026",
            "min_price": "2000",
            "max_price": "2500",
            "modal_price": "2300"
        }
        cleaned = clean_mandi_record(raw_valid)
        self.assertIsNotNone(cleaned)
        self.assertEqual(cleaned["state"], "Maharashtra")
        self.assertEqual(cleaned["market"], "Lasalgaon")
        self.assertEqual(cleaned["modal_price"], 2300.0)
        self.assertEqual(cleaned["modal_price_kg"], 23.0)

        # Invalid record (price 0)
        raw_invalid = {
            "market": "Test",
            "modal_price": "0"
        }
        self.assertIsNone(clean_mandi_record(raw_invalid))

    def test_cache_status_endpoint(self):
        res = self.client.get("/api/status")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertIn("total_records", data["data"])
        self.assertGreater(data["data"]["total_records"], 0)

    def test_commodities_endpoint(self):
        res = self.client.get("/api/commodities")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("Onion", data["commodities"])
        self.assertIn("Wheat", data["commodities"])

    def test_mandis_endpoint(self):
        commodities = get_distinct_commodities()
        self.assertGreater(len(commodities), 0)
        c = commodities[0]
        res = self.client.get(f"/api/mandis?commodity={c}")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreater(data["count"], 0)

    def test_fair_price_endpoint(self):
        commodities = get_distinct_commodities()
        self.assertGreater(len(commodities), 0)
        c = "Onion" if "Onion" in commodities else commodities[0]
        mandis = get_distinct_mandis(commodity=c)
        self.assertGreater(len(mandis), 0)
        m = mandis[0]["market"]

        res = self.client.get(f"/api/fair-price?crop={c}&mandi={m}")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        forecast_data = data["data"]
        self.assertIn("fair_price_band_kg", forecast_data)
        self.assertIn("forecast_7_days", forecast_data)
        self.assertEqual(len(forecast_data["forecast_7_days"]), 7)

    def test_mandi_comparator(self):
        res = self.client.get("/api/compare-mandis?crop=Onion&location=Nashik")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        comp = data["data"]
        self.assertIsNotNone(comp["best_mandi"])
        self.assertGreater(len(comp["comparison"]), 0)
        # Check sorting: highest net price first
        first_net = comp["comparison"][0]["net_price_kg"]
        last_net = comp["comparison"][-1]["net_price_kg"]
        self.assertGreaterEqual(first_net, last_net)

    def test_marketplace_crud(self):
        # Create
        new_listing = {
            "farmer_name": "Test Farmer",
            "phone": "9999999999",
            "crop": "Tomato",
            "quantity_kg": 500,
            "asking_price_kg": 25.0,
            "location": "Pune",
            "notes": "Automated test item"
        }
        res_post = self.client.post("/api/listings", json=new_listing)
        self.assertEqual(res_post.status_code, 201)
        post_data = res_post.get_json()
        self.assertTrue(post_data["success"])
        listing_id = post_data["listing"]["id"]

        # Read back
        res_get = self.client.get("/api/listings?crop=Tomato")
        self.assertEqual(res_get.status_code, 200)
        listings = res_get.get_json()["listings"]
        ids = [l["id"] for l in listings]
        self.assertIn(listing_id, ids)

        # Clean up so test listing never pollutes DB
        from marketplace_db import get_db_connection
        with get_db_connection() as conn:
            conn.execute("DELETE FROM listings WHERE id = ?", (listing_id,))
            conn.commit()

    def test_markup_detector(self):
        # Normal
        r_normal = analyze_price_markup(20.0, 30.0, "Onion")
        self.assertEqual(r_normal["status"], "Normal")

        # Excessive
        r_excess = analyze_price_markup(15.0, 60.0, "Tomato")
        self.assertEqual(r_excess["status"], "Excessive")
        self.assertGreater(r_excess["markup_pct"], 150)


if __name__ == "__main__":
    unittest.main()
