"""Product image classifier via Gemini Vision."""
from .llm import chat_vision, _extract_json

CATEGORIES = [
    "Electronics",
    "Clothing & Apparel",
    "Groceries & Food",
    "Home & Kitchen",
    "Beauty & Personal Care",
    "Toys & Games",
    "Sports & Outdoors",
    "Books & Stationery",
    "Health & Wellness",
    "Accessories",
    "Other",
]

SYSTEM = (
    "You are a retail product classifier. Given a product photo, pick the single best category "
    f"from this fixed list: {', '.join(CATEGORIES)}. Provide a specific subcategory (2-4 words), "
    "a confidence in 0.0-1.0, and a one-sentence description. "
    'Respond ONLY as compact JSON: {"category": "...", "subcategory": "...", '
    '"confidence": 0.0-1.0, "description": "..."}. No extra text.'
)


async def classify_product(image_b64: str) -> dict:
    raw = await chat_vision(SYSTEM, "Classify this product image.", image_b64)
    try:
        data = _extract_json(raw)
        cat = str(data.get("category", "Other")).strip()
        if cat not in CATEGORIES:
            # Try loose match
            match = next((c for c in CATEGORIES if c.lower() in cat.lower() or cat.lower() in c.lower()), None)
            cat = match or "Other"
        return {
            "category": cat,
            "subcategory": str(data.get("subcategory", "") or "").strip() or None,
            "confidence": max(0.0, min(1.0, float(data.get("confidence", 0.7)))),
            "description": str(data.get("description", "") or "").strip() or None,
        }
    except Exception:
        return {"category": "Other", "subcategory": None, "confidence": 0.3, "description": None}
