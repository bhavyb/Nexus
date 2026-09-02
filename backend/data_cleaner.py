"""
Nexus Data Cleaner Module
Cleans, standardizes, and validates records from India's Open Government Data (OGD)
Agmarknet dataset: "Current Daily Price of Various Commodities from Various Markets (Mandi)"
Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
"""

import re
from datetime import datetime
from typing import List, Dict, Any, Tuple


def clean_text(text: Any) -> str:
    """Standardizes string values: trims whitespace, handles title casing."""
    if text is None:
        return ""
    text_str = str(text).strip()
    # Normalize excessive spaces
    text_str = re.sub(r'\s+', ' ', text_str)
    # Title-case for consistency across diverse mandi reporting
    return text_str.title()


def parse_date(date_str: Any) -> str:
    """
    Parses arrival_date from diverse Agmarknet formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
    into standard ISO YYYY-MM-DD.
    """
    if not date_str:
        return ""
    date_clean = str(date_str).strip()
    
    # Try standard formats used in OGD India
    formats = [
        "%d/%m/%Y",
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%y",
        "%Y/%m/%d",
        "%b %d, %Y"
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_clean, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
            
    return date_clean


def parse_price(val: Any) -> float:
    """Parses and validates price strings into float numbers."""
    if val is None:
        return 0.0
    try:
        # Strip currency symbols, commas or unit strings
        cleaned = re.sub(r'[^\d.]', '', str(val))
        if not cleaned:
            return 0.0
        return float(cleaned)
    except (ValueError, TypeError):
        return 0.0


def clean_mandi_record(raw: Dict[str, Any]) -> Dict[str, Any] | None:
    """
    Cleans an individual record:
    - Drops rows with missing or non-positive modal_price
    - Parses arrival_date
    - Standardizes commodity, market, district, state casing
    - Validates min_price and max_price sanity bounds
    """
    modal_price = parse_price(raw.get("modal_price"))
    if modal_price <= 0:
        # Per SIH specification: drop records with missing modal_price or price <= 0
        return None

    min_price = parse_price(raw.get("min_price"))
    max_price = parse_price(raw.get("max_price"))
    
    # Sanity check: min <= modal <= max
    if min_price <= 0:
        min_price = modal_price * 0.95
    if max_price <= 0:
        max_price = modal_price * 1.05
    if min_price > modal_price:
        min_price = modal_price
    if max_price < modal_price:
        max_price = modal_price

    arrival_date = parse_date(raw.get("arrival_date"))
    if not arrival_date:
        arrival_date = datetime.now().strftime("%Y-%m-%d")

    commodity = clean_text(raw.get("commodity"))
    market = clean_text(raw.get("market"))
    state = clean_text(raw.get("state"))
    district = clean_text(raw.get("district"))
    variety = clean_text(raw.get("variety")) or "General"

    # Outlier filter: Agmarknet prices are in ₹/quintal (1 quintal = 100 kg).
    # Typical commodities range from ₹100/quintal to ₹50,000/quintal (e.g. Saffron/Spices higher).
    # Filter out extreme transmission errors (e.g. modal_price > 500,000 or negative)
    if modal_price > 500000 or modal_price < 50:
        return None

    return {
        "state": state,
        "district": district,
        "market": market,
        "commodity": commodity,
        "variety": variety,
        "arrival_date": arrival_date,
        "min_price": round(min_price, 2),
        "max_price": round(max_price, 2),
        "modal_price": round(modal_price, 2),
        # Helper field: Price in ₹/kg for farmer intuitive display (1 quintal = 100 kg)
        "modal_price_kg": round(modal_price / 100.0, 2)
    }


def clean_mandi_dataset(records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    """
    Cleans a batch of mandi records and returns stats.
    """
    cleaned = []
    dropped_count = 0

    for item in records:
        cleaned_item = clean_mandi_record(item)
        if cleaned_item:
            cleaned.append(cleaned_item)
        else:
            dropped_count += 1

    stats = {
        "total_received": len(records),
        "valid_retained": len(cleaned),
        "dropped_outliers_or_missing": dropped_count
    }
    return cleaned, stats
