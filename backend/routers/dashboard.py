"""Dashboard aggregation routes."""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter

from db import customers, visits, feedback, chat_messages, products

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _today_iso_prefix() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


@router.get("/stats")
async def stats():
    total_customers = await customers.count_documents({})
    total_visits = await visits.count_documents({})
    today = _today_iso_prefix()
    visits_today = await visits.count_documents({"timestamp": {"$regex": f"^{today}"}})
    total_feedback = await feedback.count_documents({})
    chatbot_queries = await chat_messages.count_documents({"role": "user"})
    products_classified = await products.count_documents({})

    sentiment_pipeline = [{"$group": {"_id": "$label", "count": {"$sum": 1}}}]
    sentiment = {"positive": 0, "negative": 0, "neutral": 0}
    async for row in feedback.aggregate(sentiment_pipeline):
        sentiment[row["_id"]] = row["count"]

    return {
        "total_customers": total_customers,
        "visits_today": visits_today,
        "total_visits": total_visits,
        "total_feedback": total_feedback,
        "chatbot_queries": chatbot_queries,
        "products_classified": products_classified,
        "sentiment_breakdown": sentiment,
    }


@router.get("/visits-timeline")
async def visits_timeline(days: int = 7):
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days - 1)
    start_iso = start.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    pipeline = [
        {"$match": {"timestamp": {"$gte": start_iso}}},
        {"$project": {"day": {"$substr": ["$timestamp", 0, 10]}}},
        {"$group": {"_id": "$day", "count": {"$sum": 1}}},
    ]
    counts: dict[str, int] = {}
    async for r in visits.aggregate(pipeline):
        counts[r["_id"]] = r["count"]
    out = []
    for i in range(days):
        d = (start + timedelta(days=i)).strftime("%Y-%m-%d")
        out.append({"date": d, "visits": counts.get(d, 0)})
    return out


@router.get("/category-distribution")
async def category_distribution():
    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    return [{"category": r["_id"], "count": r["count"]} async for r in products.aggregate(pipeline)]


@router.get("/activity")
async def recent_activity(limit: int = 12):
    out = []
    async for v in visits.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit):
        out.append({
            "kind": "visit",
            "title": f"Visit: {v['customer_name']}",
            "detail": "Returning customer" if not v.get("is_new") else "New customer",
            "timestamp": v["timestamp"],
        })
    async for f in feedback.find({}, {"_id": 0}).sort("created_at", -1).limit(limit):
        out.append({
            "kind": "feedback",
            "title": f"Feedback tagged {f['label']}",
            "detail": f["text"][:80],
            "timestamp": f["created_at"],
        })
    async for c in chat_messages.find({"role": "user"}, {"_id": 0}).sort("created_at", -1).limit(limit):
        out.append({
            "kind": "chat",
            "title": "Chatbot query",
            "detail": c["content"][:80],
            "timestamp": c["created_at"],
        })
    async for p in products.find({}, {"_id": 0}).sort("created_at", -1).limit(limit):
        out.append({
            "kind": "product",
            "title": f"Classified: {p['category']}",
            "detail": p.get("subcategory") or p.get("description") or "",
            "timestamp": p["created_at"],
        })
    out.sort(key=lambda x: x["timestamp"], reverse=True)
    return out[:limit]
