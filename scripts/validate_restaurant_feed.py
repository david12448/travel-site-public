"""Validate the public restaurant feed before it is published.

Only sanitized data belongs in the public repository. No third-party
restaurant source ID, raw source URL, parser path, or API secret is allowed.
"""
import datetime as dt
import json
import re
import sys
from pathlib import Path

TOP_KEYS = {"schema_version", "generated_at", "restaurants"}
RESTAURANT_KEYS = {
    "restaurant_id", "name", "area", "destination_ids", "nearby_spot_ids",
    "cuisine_tags", "geo", "address_summary", "business_status",
    "price_per_person", "last_verified_at", "attribution",
    "source_tokens", "recognitions"
}
REQUIRED = {"restaurant_id", "name", "area", "destination_ids", "cuisine_tags",
            "business_status", "last_verified_at", "attribution"}
BLOCKED_KEYS = {
    "source_id", "source_url", "original_url", "raw_url", "raw_snapshot",
    "raw_snapshots", "api_key", "api_endpoint", "parser", "collector",
    "source_registry", "provider_id", "internal_id", "source_mapping"
}
STATUSES = {"registered_active", "registered_closed", "unknown"}
PUBLIC_ID = re.compile(r"^rst_[A-Za-z0-9_-]{6,80}$")
TOKEN = re.compile(r"^src_[a-z0-9_-]{8,100}$")


# Public fields must not smuggle original URLs or private file locations in strings.
# The validator is a publication guard, not a substitute for private-source review.
PUBLIC_TEXT_URL = re.compile(
    r"(?i)(?:\\b(?:https?|ftp|file)://|(?<!\\w)www\\.|"
    r"(?<!\\w)//[a-z0-9.-]+(?:/|$)|"
    r"\\b[a-z0-9.-]+\\.(?:com|net|org|io|co\\.kr|go\\.kr|kr|jp|dev|app|info)(?:[/?:#]|\\b))"
)
PRIVATE_PATH = re.compile(
    r"(?i)(?:[a-z]:[\\\\/]|(?:^|[\\s\\(\\[\\\"'\\x60])\\.{1,2}[/\\\\]|"
    r"(?:^|[/\\\\\\s])(?:private|internal|raw[_-]?snapshots?|collectors?|"
    r"parsers?|source[_-]?registry|secrets?)[/\\\\]|"
    r"(?<!\\w)/[a-z0-9_.-]+(?:/[a-z0-9_.-]+)+)"
)

def verify_date(value, field):
    if not isinstance(value, str):
        raise ValueError(f"{field}: expected YYYY-MM-DD string")
    try:
        if dt.date.fromisoformat(value).isoformat() != value:
            raise ValueError()
    except ValueError:
        raise ValueError(f"{field}: invalid ISO date") from None


def ensure_no_internals(value):
    if isinstance(value, dict):
        for key, entry in value.items():
            if key.lower() in BLOCKED_KEYS:
                raise ValueError(f"internal field exposed: {key}")
            ensure_no_internals(entry)
    elif isinstance(value, list):
        for entry in value:
            ensure_no_internals(entry)
    elif isinstance(value, str):
        if PUBLIC_TEXT_URL.search(value) or PRIVATE_PATH.search(value):
            raise ValueError("public text contains URL or internal path")


def validate(payload):
    if not isinstance(payload, dict) or set(payload) != TOP_KEYS:
        raise ValueError("incorrect top-level feed fields")
    if payload["schema_version"] != "1.0":
        raise ValueError("unsupported feed version")
    venues = payload["restaurants"]
    if not isinstance(venues, list):
        raise ValueError("restaurants must be an array")
    generated_at = payload["generated_at"]
    if generated_at is None:
        if venues:
            raise ValueError("populated feed needs a generated_at timestamp")
    else:
        if not isinstance(generated_at, str):
            raise ValueError("generated_at must be an ISO timestamp")
        try:
            if dt.datetime.fromisoformat(generated_at.replace("Z", "+00:00")).tzinfo is None:
                raise ValueError("generated_at must include a timezone")
        except ValueError:
            raise ValueError("generated_at: invalid timezone-aware ISO timestamp") from None
    ensure_no_internals(payload)
    seen = set()
    for idx, item in enumerate(venues):
        if not isinstance(item, dict):
            raise ValueError(f"restaurants[{idx}]: expected an object")
        if not REQUIRED <= set(item) or not set(item) <= RESTAURANT_KEYS:
            raise ValueError(f"restaurants[{idx}]: missing or unexpected fields")
        rid = item["restaurant_id"]
        if not isinstance(rid, str) or not PUBLIC_ID.fullmatch(rid):
            raise ValueError(f"restaurants[{idx}]: invalid restaurant_id")
        if rid in seen:
            raise ValueError(f"restaurants[{idx}]: duplicate restaurant_id")
        seen.add(rid)
        if not isinstance(item["name"], str) or not item["name"].strip():
            raise ValueError(f"restaurants[{idx}]: empty name")
        area = item["area"]
        if not isinstance(area, dict) or not {"sido", "sigungu"} <= set(area) or not set(area) <= {"sido", "sigungu", "sido_code", "sigungu_code"}:
            raise ValueError(f"restaurants[{idx}]: invalid area")
        if any(not isinstance(area[k], str) or not area[k].strip() for k in ("sido", "sigungu")):
            raise ValueError(f"restaurants[{idx}]: invalid area names")
        for field in ("destination_ids", "nearby_spot_ids", "cuisine_tags", "attribution", "source_tokens"):
            if field in item:
                a = item[field]
                if not isinstance(a, list) or any(not isinstance(v, str) or not v.strip() for v in a) or len(set(a)) != len(a):
                    raise ValueError(f"restaurants[{idx}]: invalid {field}")
        for token in item.get("source_tokens", []):
            if not TOKEN.fullmatch(token):
                raise ValueError(f"restaurants[{idx}]: invalid source_token")
        if item["business_status"] not in STATUSES:
            raise ValueError(f"restaurants[{idx}]: invalid business status")
        verify_date(item["last_verified_at"], "last_verified_at")
        if "geo" in item:
            geo = item["geo"]
            if not isinstance(geo, dict) or set(geo) != {"lat", "lng"} or any(isinstance(geo[k], bool) or not isinstance(geo[k], (int, float)) for k in ("lat", "lng")) or not (-90 <= geo["lat"] <= 90 and -180 <= geo["lng"] <= 180):
                raise ValueError(f"restaurants[{idx}]: invalid coordinates")
        if "price_per_person" in item:
            price = item["price_per_person"]
            if not isinstance(price, dict) or set(price) != {"currency", "min", "max", "verified_at"} or price["currency"] != "KRW" or not all(type(price[k]) is int and price[k] >= 0 for k in ("min", "max")) or price["max"] < price["min"]:
                raise ValueError(f"restaurants[{idx}]: invalid price range")
            verify_date(price["verified_at"], "price_per_person.verified_at")
        if "recognitions" in item:
            recs = item["recognitions"]
            if not isinstance(recs, list):
                raise ValueError(f"restaurants[{idx}]: invalid recognitions")
            for r in recs:
                if not isinstance(r, dict) or set(r) != {"organization", "label", "year"} or not isinstance(r["organization"], str) or not isinstance(r["label"], str) or type(r["year"]) is not int:
                    raise ValueError(f"restaurants[{idx}]: recognition requires organization/label/year")
    return len(venues)


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/data/restaurants.json")
    try:
        count = validate(json.loads(path.read_text(encoding="utf-8")))
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    print(f"PASS: sanitized restaurant feed ({count} records)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
