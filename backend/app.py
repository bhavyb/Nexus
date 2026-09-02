"""
Nexus Main Flask Application
SIH 2026: AI-Powered Farm-to-Market Intelligence Platform
(Demand-to-Delivery Agricultural Network)

Endpoints:
1. Core Market Data:
   - GET  /api/status
   - GET  /api/commodities
   - GET  /api/mandis
   - GET  /api/fair-price
   - GET  /api/compare-mandis
   - GET  /api/reverse-geocode
   - POST /api/refresh-data

2. Direct Listings & Pre-Harvest:
   - GET  /api/listings
   - POST /api/listings

3. Anti-Gouging & Markup:
   - POST /api/markup-check
   - GET  /api/markup-benchmark

4. AI Intelligence Engine:
   - GET  /api/demand-forecast
   - GET  /api/demand-heatmap
   - GET  /api/sellability-score
   - POST /api/smart-match
   - POST /api/route-optimize
   - GET  /api/waste-prevention
   - GET  /api/traceability/<id>
   - GET  /api/impact-metrics

5. Stakeholder Portals (Bulk Buyers & Community Pools):
   - GET  /api/bulk-demands
   - POST /api/bulk-demands
   - GET  /api/community-pools
   - POST /api/community-pools/pledge
"""

import logging
import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler

from data_fetcher import (
    get_cache_status,
    get_distinct_commodities,
    get_distinct_mandis,
    get_distinct_locations,
    get_mandi_data,
)
from forecaster import predict_fair_price
from mandi_comparator import compare_mandis_for_crop, reverse_geocode_coordinates
from marketplace_db import (
    create_listing,
    get_listings,
    get_listing_by_id,
    create_bulk_demand,
    get_bulk_demands,
    get_community_pools,
    pledge_to_community_pool,
    get_pre_harvest_bookings,
    get_logistics_fleet,
    register_logistics_partner
)
from markup_detector import analyze_price_markup, get_live_commodity_benchmark
from ai_engine import (
    predict_regional_demand,
    get_demand_heatmap,
    calculate_sellability_score,
    match_harvest_to_buyers,
    optimize_shared_logistics_route,
    evaluate_waste_prevention,
    get_farm_to_fork_trace,
    get_system_impact_metrics
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"))
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("NexusApp")

DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))
app = Flask(__name__, static_folder=DIST_DIR, static_url_path="")
# Enable CORS for all routes (allows React frontend on port 5173 or any dev port)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# -----------------------------------------------------------------------------
# Scheduled Background Refresh Job
# -----------------------------------------------------------------------------
def scheduled_daily_refresh():
    """Background task to pull fresh Agmarknet data daily."""
    logger.info("Executing scheduled background mandi data refresh...")
    try:
        res = get_mandi_data(force_refresh=True)
        logger.info(f"Scheduled refresh complete. Status: {res.get('metadata', {}).get('notice')}")
    except Exception as e:
        logger.error(f"Scheduled refresh error: {e}")

scheduler = BackgroundScheduler(daemon=True)
scheduler.add_job(scheduled_daily_refresh, "interval", hours=6)
scheduler.start()


# -----------------------------------------------------------------------------
# 1. CORE MARKET DATA & GOVERNMENT AGMARKNET INTEGRATION
# -----------------------------------------------------------------------------

@app.route("/api/status", methods=["GET"])
def api_status():
    """Returns server health, cache timestamp, provenance info, and API key status."""
    status = get_cache_status()
    return jsonify({
        "success": True,
        "app": "Nexus AI Agricultural Intelligence Platform",
        "version": "2.0-DemandToDelivery",
        "data": status
    })


@app.route("/api/commodities", methods=["GET"])
def api_commodities():
    """GET /api/commodities -> distinct list of crops in dataset."""
    try:
        commodities = get_distinct_commodities()
        return jsonify({
            "success": True,
            "count": len(commodities),
            "commodities": commodities
        })
    except Exception as e:
        logger.error(f"Error fetching commodities: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/locations", methods=["GET"])
def api_locations():
    """GET /api/locations -> all real states, districts, and markets from the dataset."""
    try:
        locs = get_distinct_locations()
        return jsonify({
            "success": True,
            "data": locs
        })
    except Exception as e:
        logger.error(f"Error fetching locations: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/mandis", methods=["GET"])
def api_mandis():
    """GET /api/mandis?commodity=X&state=Y -> distinct mandis reporting that crop."""
    commodity = request.args.get("commodity")
    state = request.args.get("state")
    try:
        mandis = get_distinct_mandis(commodity=commodity, state=state)
        return jsonify({
            "success": True,
            "commodity": commodity,
            "state": state,
            "count": len(mandis),
            "mandis": mandis
        })
    except Exception as e:
        logger.error(f"Error fetching mandis: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/fair-price", methods=["GET"])
def api_fair_price():
    """GET /api/fair-price?crop=X&mandi=Y -> forecast band + 7-day trend."""
    crop = request.args.get("crop")
    mandi = request.args.get("mandi")
    force_retrain = request.args.get("retrain", "false").lower() == "true"

    if not crop:
        return jsonify({"success": False, "error": "Missing required parameter: 'crop'"}), 400
    if not mandi:
        return jsonify({"success": False, "error": "Missing required parameter: 'mandi'"}), 400

    try:
        result = predict_fair_price(crop=crop, mandi=mandi, force_retrain=force_retrain)
        return jsonify({
            "success": True,
            "data": result
        })
    except ValueError as ve:
        logger.warning(f"Fair price prediction warning: {ve}")
        return jsonify({"success": False, "error": str(ve)}), 404
    except Exception as e:
        logger.error(f"Fair price prediction error: {e}", exc_info=True)
        return jsonify({"success": False, "error": f"Forecasting error: {str(e)}"}), 500


@app.route("/api/compare-mandis", methods=["GET"])
def api_compare_mandis():
    """GET /api/compare-mandis?crop=X&lat=&lng=&location="""
    crop = request.args.get("crop")
    lat_str = request.args.get("lat")
    lng_str = request.args.get("lng")
    location = request.args.get("location")
    rate_str = request.args.get("transport_rate", "25.0")
    load_str = request.args.get("load_kg", "1500.0")

    if not crop:
        return jsonify({"success": False, "error": "Missing required parameter: 'crop'"}), 400

    try:
        farmer_lat = float(lat_str) if lat_str and lat_str.strip() else None
        farmer_lng = float(lng_str) if lng_str and lng_str.strip() else None
        vehicle_rate = float(rate_str) if rate_str else 25.0
        load_capacity = float(load_str) if load_str else 1500.0
        max_radius_str = request.args.get("max_radius")
        max_radius = float(max_radius_str) if max_radius_str and max_radius_str.strip() else None

        res = compare_mandis_for_crop(
            crop=crop,
            farmer_lat=farmer_lat,
            farmer_lng=farmer_lng,
            farmer_location=location,
            vehicle_rate_per_km=vehicle_rate,
            load_capacity_kg=load_capacity,
            max_radius_km=max_radius
        )
        return jsonify({
            "success": True,
            "data": res
        })
    except Exception as e:
        logger.error(f"Error comparing mandis: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/reverse-geocode", methods=["GET"])
def api_reverse_geocode():
    """GET /api/reverse-geocode?lat=X&lng=Y"""
    lat_str = request.args.get("lat")
    lng_str = request.args.get("lng")
    if not lat_str or not lng_str:
        return jsonify({"success": False, "error": "Missing 'lat' or 'lng' parameter"}), 400
    try:
        lat = float(lat_str)
        lng = float(lng_str)
        geo = reverse_geocode_coordinates(lat, lng)
        return jsonify({"success": True, "data": geo})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------------------------
# 2. DIRECT MARKETPLACE & PRE-HARVEST
# -----------------------------------------------------------------------------

@app.route("/api/listings", methods=["GET", "POST"])
def api_listings():
    """
    GET  /api/listings?crop=X&location=Y&is_pre_harvest=0/1
    POST /api/listings -> create and persist listing
    """
    if request.method == "POST":
        payload = request.get_json(force=True, silent=True)
        if not payload:
            return jsonify({"success": False, "error": "Invalid or missing JSON payload"}), 400

        required_fields = ["farmer_name", "phone", "crop", "quantity_kg", "asking_price_kg", "location"]
        for f in required_fields:
            if not payload.get(f):
                return jsonify({"success": False, "error": f"Missing required field: '{f}'"}), 400

        try:
            listing = create_listing(
                farmer_name=payload["farmer_name"],
                phone=payload["phone"],
                crop=payload["crop"],
                variety=payload.get("variety", "Standard"),
                quantity_kg=float(payload["quantity_kg"]),
                asking_price_kg=float(payload["asking_price_kg"]),
                location=payload["location"],
                state=payload.get("state", ""),
                mandi_reference=payload.get("mandi_reference", ""),
                fair_price_min=float(payload.get("fair_price_min", 0.0)),
                fair_price_max=float(payload.get("fair_price_max", 0.0)),
                notes=payload.get("notes", ""),
                is_pre_harvest=int(payload.get("is_pre_harvest", 0)),
                harvest_date=payload.get("harvest_date", ""),
                min_price_kg=float(payload.get("min_price_kg", 0.0)),
                sellability_score=int(payload.get("sellability_score", 85)),
                shelf_life_days=int(payload.get("shelf_life_days", 6))
            )
            return jsonify({
                "success": True,
                "message": "Listing published successfully",
                "listing": listing
            }), 201
        except Exception as e:
            logger.error(f"Error creating listing: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    else:
        crop = request.args.get("crop")
        location = request.args.get("location")
        pre_harvest_str = request.args.get("is_pre_harvest")
        is_pre = int(pre_harvest_str) if pre_harvest_str is not None else None
        try:
            listings = get_listings(crop=crop, location=location, is_pre_harvest=is_pre)
            return jsonify({
                "success": True,
                "count": len(listings),
                "listings": listings
            })
        except Exception as e:
            logger.error(f"Error fetching listings: {e}")
            return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------------------------
# 3. INTERMEDIARY MARKUP & ANTI-GOUGING
# -----------------------------------------------------------------------------

@app.route("/api/markup-check", methods=["POST"])
def api_markup_check():
    """POST /api/markup-check -> { farmer_price, consumer_price, commodity }"""
    payload = request.get_json(force=True, silent=True)
    if not payload:
        return jsonify({"success": False, "error": "Invalid or missing JSON payload"}), 400

    farmer_price = payload.get("farmer_price")
    consumer_price = payload.get("consumer_price")
    commodity = payload.get("commodity")

    if farmer_price is None or consumer_price is None:
        return jsonify({"success": False, "error": "Both 'farmer_price' and 'consumer_price' are required"}), 400

    try:
        f_price = float(farmer_price)
        c_price = float(consumer_price)
        result = analyze_price_markup(
            farmer_price=f_price,
            consumer_price=c_price,
            commodity=commodity
        )
        return jsonify({"success": True, "data": result})
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error analyzing markup: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/markup-benchmark", methods=["GET"])
def api_markup_benchmark():
    """GET /api/markup-benchmark?commodity=X"""
    commodity = request.args.get("commodity", "Onion")
    try:
        data = get_live_commodity_benchmark(commodity)
        return jsonify({"success": True, "data": data})
    except Exception as e:
        logger.error(f"Error fetching markup benchmark: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------------------------
# 4. AI DEMAND FORECASTING & REGIONAL HEATMAP
# -----------------------------------------------------------------------------

@app.route("/api/demand-forecast", methods=["GET"])
def api_demand_forecast():
    """
    GET /api/demand-forecast?commodity=Tomato&location=Ahmedabad
    Returns 14-day history + 7-day predicted demand (kg/day), signal weights, and farmer advice.
    """
    commodity = request.args.get("commodity", "Tomato")
    location = request.args.get("location", "Ahmedabad")
    try:
        data = predict_regional_demand(commodity=commodity, location=location)
        return jsonify({"success": True, "data": data})
    except Exception as e:
        logger.error(f"Error in demand forecast: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/demand-heatmap", methods=["GET"])
def api_demand_heatmap():
    """
    GET /api/demand-heatmap?commodity=Tomato
    Returns regional demand intensity (HIGH, MEDIUM, LOW) across Gujarat/Western India hubs.
    """
    commodity = request.args.get("commodity", "Tomato")
    try:
        data = get_demand_heatmap(commodity=commodity)
        return jsonify({"success": True, "data": data})
    except Exception as e:
        logger.error(f"Error fetching demand heatmap: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------------------------
# 5. AI SMART MATCHING & SELLABILITY SCORING
# -----------------------------------------------------------------------------

@app.route("/api/smart-match", methods=["POST"])
def api_smart_match():
    """
    POST /api/smart-match
    Payload: { commodity, quantity_kg, asking_price_kg, location }
    Optimally matches harvest with bulk buyers and community orders.
    """
    payload = request.get_json(force=True, silent=True) or {}
    commodity = payload.get("commodity", "Tomato")
    quantity_kg = float(payload.get("quantity_kg", 500))
    asking_price = float(payload.get("asking_price_kg", 22.0))
    location = payload.get("location", "Ahmedabad")

    try:
        res = match_harvest_to_buyers(
            commodity=commodity,
            quantity_kg=quantity_kg,
            asking_price_kg=asking_price,
            location=location
        )
        return jsonify({"success": True, "data": res})
    except Exception as e:
        logger.error(f"Error running smart match: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/sellability-score", methods=["GET"])
def api_sellability_score():
    """
    GET /api/sellability-score?crop=Tomato&quantity=500&location=Sanand&shelf_life=5
    Returns 0-100 score, risk level, and waste mitigation strategies.
    """
    crop = request.args.get("crop", "Tomato")
    qty = float(request.args.get("quantity", 500))
    location = request.args.get("location", "Ahmedabad")
    shelf_life_str = request.args.get("shelf_life")
    shelf_life = int(shelf_life_str) if shelf_life_str else None

    try:
        score_data = calculate_sellability_score(
            commodity=crop,
            quantity_kg=qty,
            location=location,
            shelf_life_days=shelf_life
        )
        return jsonify({"success": True, "data": score_data})
    except Exception as e:
        logger.error(f"Error calculating sellability score: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------------------------
# 6. CAPACITATED ROUTE OPTIMIZATION & SHARED LOGISTICS
# -----------------------------------------------------------------------------

@app.route("/api/route-optimize", methods=["POST"])
def api_route_optimize():
    """
    POST /api/route-optimize
    Solves shared vehicle routing (multi-pickup, multi-drop) and returns distance/cost/CO2 savings.
    """
    payload = request.get_json(force=True, silent=True) or {}
    vehicle_cap = float(payload.get("vehicle_capacity_kg", 1000.0))
    cost_km = float(payload.get("cost_per_km", 24.0))
    pickups = payload.get("pickups")
    deliveries = payload.get("deliveries")

    try:
        route_data = optimize_shared_logistics_route(
            pickups=pickups,
            deliveries=deliveries,
            vehicle_capacity_kg=vehicle_cap,
            cost_per_km=cost_km
        )
        return jsonify({"success": True, "data": route_data})
    except Exception as e:
        logger.error(f"Error optimizing routes: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/logistics/fleet", methods=["GET"])
def api_logistics_fleet():
    """GET /api/logistics/fleet -> returns registered logistics partners with Reliability Scores."""
    status = request.args.get("status")
    try:
        fleet = get_logistics_fleet(status=status)
        return jsonify({"success": True, "fleet": fleet, "count": len(fleet)})
    except Exception as e:
        logger.error(f"Error fetching fleet: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/logistics/partner-register", methods=["POST"])
def api_logistics_partner_register():
    """POST /api/logistics/partner-register -> registers a new commercial vehicle partner."""
    payload = request.get_json(force=True, silent=True) or {}
    company = payload.get("company", "").strip()
    vehicle_type = payload.get("vehicle_type", "Mini Truck (Tata Ace)").strip()
    vehicle_capacity_kg = float(payload.get("vehicle_capacity_kg", 1000.0))
    current_location = payload.get("current_location", "Ahmedabad").strip()
    service_areas = payload.get("service_areas", "Ahmedabad, Gandhinagar").strip()
    vehicle_number = payload.get("vehicle_number", "").strip()

    if not company:
        return jsonify({"success": False, "error": "Company / Partner name is required"}), 400

    try:
        partner = register_logistics_partner(
            company=company,
            vehicle_type=vehicle_type,
            vehicle_capacity_kg=vehicle_capacity_kg,
            current_location=current_location,
            service_areas=service_areas,
            vehicle_number=vehicle_number
        )
        return jsonify({"success": True, "partner": partner})
    except Exception as e:
        logger.error(f"Error registering logistics partner: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------------------------
# 7. FOOD WASTE PREVENTION & TRACEABILITY
# -----------------------------------------------------------------------------

@app.route("/api/waste-prevention", methods=["GET"])
def api_waste_prevention():
    """GET /api/waste-prevention -> scans active listings for perishable risk."""
    try:
        listings = get_listings()
        waste_data = evaluate_waste_prevention(listings)
        return jsonify({"success": True, "data": waste_data})
    except Exception as e:
        logger.error(f"Error analyzing food waste risk: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/traceability/<int:listing_id>", methods=["GET"])
def api_traceability(listing_id: int):
    """GET /api/traceability/1 -> verifiable farm-to-fork origin and cold-chain timeline."""
    try:
        listing = get_listing_by_id(listing_id)
        trace = get_farm_to_fork_trace(listing_id, listing)
        return jsonify({"success": True, "data": trace})
    except Exception as e:
        logger.error(f"Error fetching traceability: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------------------------
# 8. BULK DEMANDS & COMMUNITY POOLS
# -----------------------------------------------------------------------------

@app.route("/api/bulk-demands", methods=["GET", "POST"])
def api_bulk_demands():
    """
    GET  /api/bulk-demands?crop=X&buyer_type=Y
    POST /api/bulk-demands -> create institutional demand
    """
    if request.method == "POST":
        payload = request.get_json(force=True, silent=True)
        if not payload:
            return jsonify({"success": False, "error": "Missing payload"}), 400
        try:
            record = create_bulk_demand(
                buyer_name=payload["buyer_name"],
                buyer_type=payload.get("buyer_type", "Restaurant"),
                phone=payload["phone"],
                crop=payload["crop"],
                quantity_needed_kg=float(payload["quantity_needed_kg"]),
                max_budget_kg=float(payload["max_budget_kg"]),
                location=payload["location"],
                required_by_date=payload.get("required_by_date", "Within 48 hours"),
                notes=payload.get("notes", "")
            )
            return jsonify({"success": True, "demand": record}), 201
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    else:
        crop = request.args.get("crop")
        buyer_type = request.args.get("buyer_type")
        demands = get_bulk_demands(crop=crop, buyer_type=buyer_type)
        return jsonify({"success": True, "count": len(demands), "demands": demands})


@app.route("/api/community-pools", methods=["GET"])
def api_community_pools():
    """GET /api/community-pools?crop=X"""
    crop = request.args.get("crop")
    pools = get_community_pools(crop=crop)
    return jsonify({"success": True, "count": len(pools), "pools": pools})


@app.route("/api/community-pools/pledge", methods=["POST"])
def api_community_pools_pledge():
    """POST /api/community-pools/pledge -> { pool_id, pledge_kg }"""
    payload = request.get_json(force=True, silent=True) or {}
    pool_id = payload.get("pool_id")
    pledge_kg = float(payload.get("pledge_kg", 5.0))
    if not pool_id:
        return jsonify({"success": False, "error": "pool_id required"}), 400

    try:
        updated = pledge_to_community_pool(int(pool_id), pledge_kg)
        return jsonify({"success": True, "pool": updated})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------------------------
# 9. MACRO SYSTEM IMPACT METRICS (SIH JUDGES)
# -----------------------------------------------------------------------------

@app.route("/api/impact-metrics", methods=["GET"])
def api_impact_metrics():
    """GET /api/impact-metrics -> macro KPIs & traditional vs nexus margin split."""
    try:
        metrics = get_system_impact_metrics()
        return jsonify({"success": True, "data": metrics})
    except Exception as e:
        logger.error(f"Error fetching impact metrics: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/refresh-data", methods=["POST"])
def api_refresh_data():
    """POST /api/refresh-data -> manually triggers live data pull from data.gov.in."""
    try:
        res = get_mandi_data(force_refresh=True)
        meta = res.get("metadata", {})
        return jsonify({
            "success": True,
            "message": "Data refresh completed",
            "metadata": meta
        })
    except Exception as e:
        logger.error(f"Error refreshing data: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Serves the production React frontend build from frontend/dist."""
    if path != "" and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    if os.path.exists(os.path.join(DIST_DIR, "index.html")):
        return send_from_directory(DIST_DIR, "index.html")
    return jsonify({
        "name": "Nexus Agricultural Platform API",
        "status": "online",
        "message": "Frontend build not found. Run 'npm run build' inside frontend/"
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Starting Nexus Farm-to-Market Intelligence Server on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
