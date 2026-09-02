"""
Nexus Data Fetcher Module
Handles live data retrieval from India's Open Government Data (OGD) Platform:
Dataset: "Current Daily Price of Various Commodities from Various Markets (Mandi)"
Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
Endpoint: https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070

Features:
- Pagination handling (loops offset + limit until complete)
- State, commodity, and date filtering
- 6-hour local caching with timestamp validation
- Resilient fallback to local cache on timeout, rate-limit, or missing API key
- Zero app crashes: always returns clean structured data with clear provenance notices
"""

import json
import logging
import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv

from data_cleaner import clean_mandi_dataset, clean_text

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Load environment variables explicitly from backend/.env or root .env
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"))
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("NexusDataFetcher")

DATA_DIR = os.path.join(BASE_DIR, "data")
CACHE_FILE = os.path.join(DATA_DIR, "mandi_cache.json")
COORDS_FILE = os.path.join(DATA_DIR, "mandi_coordinates.json")

OGD_BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
DEFAULT_CACHE_TTL = int(os.getenv("CACHE_EXPIRY_SECONDS", "21600"))  # 6 hours in seconds


def get_api_key() -> str:
    """Retrieves data.gov.in API key from environment."""
    return os.getenv("DATA_GOV_API_KEY", "").strip()


def load_cached_data() -> Dict[str, Any]:
    """Reads data from the local cache file."""
    if not os.path.exists(CACHE_FILE):
        # If cache file doesn't exist, regenerate seed
        from data.seed_generator import generate_seed_dataset
        return generate_seed_dataset()

    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading cache file: {e}")
        from data.seed_generator import generate_seed_dataset
        return generate_seed_dataset()


def save_cached_data(records: List[Dict[str, Any]], is_live: bool = True, notice: str = "") -> Dict[str, Any]:
    """Saves records and metadata to local cache."""
    os.makedirs(DATA_DIR, exist_ok=True)
    now_iso = datetime.now().isoformat()
    now_str = datetime.now().strftime("%d %b %Y, %I:%M %p")

    if not notice:
        notice = f"Live government data refreshed as of {now_str}" if is_live else f"Using cached government data from {now_str}"

    payload = {
        "metadata": {
            "source": "Agmarknet - OGD India (Dataset: 9ef84268-d588-465a-a308-a864a43d0070)",
            "last_updated": now_iso,
            "status": "live" if is_live else "cached",
            "is_live": is_live,
            "total_records": len(records),
            "notice": notice
        },
        "records": records
    }

    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        logger.info(f"Saved {len(records)} records to {CACHE_FILE}")
    except Exception as e:
        logger.error(f"Failed to write cache file: {e}")

    return payload


def is_cache_valid(cache_data: Dict[str, Any], max_age_seconds: int = DEFAULT_CACHE_TTL) -> bool:
    """Checks if the cached data is younger than max_age_seconds."""
    metadata = cache_data.get("metadata", {})
    last_updated_str = metadata.get("last_updated")
    if not last_updated_str:
        return False

    try:
        last_updated = datetime.fromisoformat(last_updated_str)
        age_seconds = (datetime.now() - last_updated).total_seconds()
        return age_seconds < max_age_seconds
    except Exception:
        return False


def fetch_from_ogd_api(
    filters: Optional[Dict[str, str]] = None,
    max_records: int = 5000,
    page_limit: int = 1000
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """
    Calls the official data.gov.in API with pagination.
    Returns: (records_list, error_message_if_any)
    """
    api_key = get_api_key()
    if not api_key:
        msg = "DATA_GOV_API_KEY is not set in backend/.env. Please obtain a free key at https://data.gov.in"
        logger.warning(msg)
        return [], msg

    all_raw_records = []
    offset = 0

    headers = {
        "User-Agent": "Nexus-Agricultural-Intelligence/1.0 (Hackathon SIH26033)",
        "Accept": "application/json"
    }

    while len(all_raw_records) < max_records:
        params: Dict[str, Any] = {
            "api-key": api_key,
            "format": "json",
            "offset": offset,
            "limit": page_limit
        }

        # Apply OGD query filters: filters[state]=..., filters[commodity]=..., etc.
        if filters:
            for k, v in filters.items():
                if v:
                    params[f"filters[{k}]"] = v

        try:
            logger.info(f"Fetching OGD API page offset={offset}, limit={page_limit}...")
            response = requests.get(OGD_BASE_URL, params=params, headers=headers, timeout=15)

            if response.status_code != 200:
                err = f"OGD API returned HTTP {response.status_code}: {response.text[:200]}"
                logger.error(err)
                return all_raw_records, err

            data = response.json()
            records = data.get("records", [])
            if not records:
                # No more records
                break

            all_raw_records.extend(records)
            total_available = data.get("total", len(all_raw_records))
            logger.info(f"Retrieved {len(records)} records (total so far: {len(all_raw_records)}/{total_available})")

            if len(records) < page_limit or len(all_raw_records) >= total_available:
                break

            offset += page_limit
            # Slight delay to avoid strict rate limiting
            time.sleep(0.3)

        except requests.exceptions.Timeout:
            err = "OGD API request timed out after 15 seconds"
            logger.error(err)
            return all_raw_records, err
        except requests.exceptions.RequestException as e:
            err = f"OGD API network error: {str(e)}"
            logger.error(err)
            return all_raw_records, err
        except Exception as e:
            err = f"Unexpected error while processing OGD API response: {str(e)}"
            logger.error(err)
            return all_raw_records, err

    return all_raw_records, None


def get_mandi_data(force_refresh: bool = False, filters: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Primary accessor for Agmarknet mandi data.
    - If cache is valid and not force_refresh: returns cached data.
    - If force_refresh or cache expired: attempts live API pull.
    - On any error or missing key: falls back to local cache gracefully.
    """
    cached = load_cached_data()
    cached_meta = cached.get("metadata", {})
    last_updated = cached_meta.get("last_updated", "Unknown")
    
    # Format human-readable timestamp
    readable_time = last_updated
    try:
        dt = datetime.fromisoformat(last_updated)
        readable_time = dt.strftime("%d %b %Y, %I:%M %p")
    except Exception:
        pass

    if not force_refresh and is_cache_valid(cached):
        # Return valid cached data
        cached["metadata"]["notice"] = f"Using cached government data (last refreshed {readable_time})"
        return cached

    # Attempt live fetch
    logger.info("Attempting live refresh from data.gov.in...")
    raw_records, error_msg = fetch_from_ogd_api(filters=filters)

    if error_msg or not raw_records:
        # Fallback to cache with documented notice
        reason = error_msg if error_msg else "No records returned"
        notice = f"Notice: Using cached government data from {readable_time} ({reason})"
        logger.info(f"Fallback active: {notice}")
        cached["metadata"]["notice"] = notice
        cached["metadata"]["is_live"] = False
        cached["metadata"]["fallback_active"] = True
        return cached

    # Clean raw records
    cleaned_records, stats = clean_mandi_dataset(raw_records)
    logger.info(f"Cleaned live dataset: retained {len(cleaned_records)} / {len(raw_records)} records.")

    if not cleaned_records:
        notice = f"Notice: Live data returned no valid records after cleaning. Using cached data from {readable_time}."
        cached["metadata"]["notice"] = notice
        return cached

    # Merge or replace cache
    saved_payload = save_cached_data(
        records=cleaned_records,
        is_live=True,
        notice=f"Live government data refreshed successfully ({len(cleaned_records)} records active)"
    )
    return saved_payload


def get_distinct_commodities() -> List[str]:
    """Returns sorted distinct list of commodity names present in the active dataset."""
    data = get_mandi_data()
    records = data.get("records", [])
    commodities = sorted({r.get("commodity") for r in records if r.get("commodity")})
    return commodities


def get_distinct_mandis(commodity: Optional[str] = None, state: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Returns distinct list of mandis with their state and district,
    optionally filtered by commodity and/or state.
    """
    data = get_mandi_data()
    records = data.get("records", [])

    mandi_dict = {}
    for r in records:
        c_match = not commodity or clean_text(r.get("commodity")) == clean_text(commodity)
        s_match = not state or clean_text(r.get("state")) == clean_text(state)

        if c_match and s_match:
            market = r.get("market")
            if market and market not in mandi_dict:
                mandi_dict[market] = {
                    "market": market,
                    "district": r.get("district", ""),
                    "state": r.get("state", ""),
                    "latest_price": r.get("modal_price", 0.0),
                    "latest_price_kg": r.get("modal_price_kg", 0.0),
                    "arrival_date": r.get("arrival_date", "")
                }

    return sorted(list(mandi_dict.values()), key=lambda x: x["market"])


def get_historical_series(commodity: str, market: str) -> List[Dict[str, Any]]:
    """
    Returns date-sorted historical arrival records for a specific commodity and mandi.
    Used by Prophet time-series model.
    """
    data = get_mandi_data()
    records = data.get("records", [])

    target_c = clean_text(commodity)
    target_m = clean_text(market)

    matched = []
    for r in records:
        if clean_text(r.get("commodity")) == target_c and clean_text(r.get("market")) == target_m:
            matched.append(r)

    # Sort chronologically
    matched.sort(key=lambda x: x.get("arrival_date", ""))
    return matched


def get_cache_status() -> Dict[str, Any]:
    """Returns metadata about the current dataset and cache status."""
    data = load_cached_data()
    meta = data.get("metadata", {})
    return {
        "source": meta.get("source", "Agmarknet - OGD India"),
        "last_updated": meta.get("last_updated", ""),
        "status": meta.get("status", "cached"),
        "is_live": meta.get("is_live", False),
        "total_records": len(data.get("records", [])),
        "notice": meta.get("notice", ""),
        "api_key_configured": bool(get_api_key())
    }


def get_distinct_locations() -> Dict[str, Any]:
    """
    Extracts all unique states, districts, and markets from the real Agmarknet dataset.
    Never returns dummy locations.
    """
    data = get_mandi_data()
    records = data.get("records", [])

    states_set = set()
    districts_dict = {}
    markets_list = []
    seen_markets = set()

    for r in records:
        state = clean_text(r.get("state", ""))
        district = clean_text(r.get("district", ""))
        market = clean_text(r.get("market", ""))

        if state:
            states_set.add(state)
        if district and state:
            d_key = f"{district} ({state})"
            if d_key not in districts_dict:
                districts_dict[d_key] = {
                    "district": district,
                    "state": state,
                    "display": d_key
                }
        if market and market not in seen_markets:
            seen_markets.add(market)
            markets_list.append({
                "market": market,
                "district": district,
                "state": state,
                "display": f"{market}, {district} ({state})" if district else f"{market} ({state})"
            })

    sorted_states = sorted(list(states_set))
    sorted_districts = sorted(list(districts_dict.values()), key=lambda x: (x["state"], x["district"]))
    sorted_markets = sorted(markets_list, key=lambda x: x["market"])

    return {
        "states": sorted_states,
        "districts": sorted_districts,
        "markets": sorted_markets,
        "total_states": len(sorted_states),
        "total_districts": len(sorted_districts),
        "total_markets": len(sorted_markets)
    }


def get_commodity_real_records(commodity: str) -> List[Dict[str, Any]]:
    """
    Retrieves all records matching commodity from the dataset.
    """
    data = get_mandi_data()
    records = data.get("records", [])
    clean_c = clean_text(commodity).lower()

    matches = [
        r for r in records
        if clean_text(r.get("commodity", "")).lower() == clean_c
    ]
    return matches

