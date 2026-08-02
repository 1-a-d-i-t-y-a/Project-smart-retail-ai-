"""Sentiment analysis routes."""
import csv
import io
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List

from schemas import SentimentRequest, BulkSentimentRequest, SentimentResult
from services.sentiment_service import analyze_sentiment
from db import feedback

router = APIRouter(prefix="/sentiment", tags=["sentiment"])


@router.post("/analyze", response_model=SentimentResult)
async def analyze(req: SentimentRequest):
    if not req.text.strip():
        raise HTTPException(400, "Text is required")
    result = await analyze_sentiment(req.text)
    doc = SentimentResult(
        text=req.text,
        label=result["label"],
        confidence=result["confidence"],
        source=req.source,
        customer_id=req.customer_id,
    )
    await feedback.insert_one(doc.model_dump())
    return doc


@router.post("/bulk", response_model=List[SentimentResult])
async def bulk(req: BulkSentimentRequest):
    if not req.items:
        raise HTTPException(400, "items is empty")
    out: List[SentimentResult] = []
    for text in req.items:
        if not text.strip():
            continue
        r = await analyze_sentiment(text)
        doc = SentimentResult(
            text=text,
            label=r["label"],
            confidence=r["confidence"],
            customer_id=req.customer_id,
        )
        await feedback.insert_one(doc.model_dump())
        out.append(doc)
    return out


@router.get("/history", response_model=List[SentimentResult])
async def history(limit: int = 100):
    items = await feedback.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return items


@router.get("/summary")
async def summary():
    pipeline = [{"$group": {"_id": "$label", "count": {"$sum": 1}}}]
    counts = {"positive": 0, "negative": 0, "neutral": 0}
    async for row in feedback.aggregate(pipeline):
        counts[row["_id"]] = row["count"]
    total = sum(counts.values())
    return {"counts": counts, "total": total}


@router.get("/export.csv")
async def export_csv():
    docs = await feedback.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "text", "label", "confidence", "source", "customer_id", "created_at"])
    for f in docs:
        writer.writerow([
            f["id"], f["text"], f["label"], f["confidence"],
            f.get("source") or "", f.get("customer_id") or "", f["created_at"],
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=feedback.csv"},
    )
