"""Vision routes: face recognition + product classification."""
import csv
import io
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List

from schemas import (
    RegisterFaceRequest,
    RecognizeFaceRequest,
    Customer,
    CustomerPublic,
    CustomerUpdate,
    Visit,
    RecognizeResponse,
    ClassifyProductRequest,
    ProductClassification,
)
from services.face_service import match_face
from services.product_service import classify_product
from db import customers, visits, products, feedback

router = APIRouter(prefix="/vision", tags=["vision"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Face ----------
@router.post("/face/register", response_model=CustomerPublic)
async def register_face(req: RegisterFaceRequest):
    if not req.name.strip():
        raise HTTPException(400, "name is required")
    if not req.image_base64:
        raise HTTPException(400, "image_base64 is required")
    customer = Customer(name=req.name.strip(), image_base64=req.image_base64)
    await customers.insert_one(customer.model_dump())
    return CustomerPublic(**customer.model_dump())


@router.post("/face/recognize", response_model=RecognizeResponse)
async def recognize_face(req: RecognizeFaceRequest):
    if not req.image_base64:
        raise HTTPException(400, "image_base64 is required")

    gallery_docs = await customers.find({}, {"_id": 0}).to_list(200)
    gallery = [
        {"id": c["id"], "name": c["name"], "image_base64": c["image_base64"]}
        for c in gallery_docs
    ]
    result = await match_face(req.image_base64, gallery)

    if result["match"]:
        matched_id = result["matched_id"]
        now = _now_iso()
        await customers.update_one(
            {"id": matched_id},
            {"$inc": {"visit_count": 1}, "$set": {"last_seen": now}},
        )
        updated = await customers.find_one({"id": matched_id}, {"_id": 0})
        visit = Visit(
            customer_id=matched_id,
            customer_name=updated["name"],
            is_new=False,
        )
        await visits.insert_one(visit.model_dump())
        return RecognizeResponse(
            matched=True,
            customer=CustomerPublic(**updated),
            confidence=result["confidence"],
            visit=visit,
        )

    return RecognizeResponse(matched=False, confidence=result["confidence"])


@router.get("/face/customers", response_model=List[CustomerPublic])
async def list_customers():
    docs = await customers.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@router.get("/face/customers/{customer_id}")
async def customer_detail(customer_id: str):
    c = await customers.find_one({"id": customer_id}, {"_id": 0})
    if not c:
        raise HTTPException(404, "customer not found")
    v = await visits.find({"customer_id": customer_id}, {"_id": 0}).sort("timestamp", -1).to_list(500)
    f = await feedback.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    p = await products.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    sent = {"positive": 0, "negative": 0, "neutral": 0}
    for row in f:
        sent[row["label"]] = sent.get(row["label"], 0) + 1
    return {"customer": c, "visits": v, "feedback": f, "products": p, "sentiment_breakdown": sent}


@router.patch("/face/customers/{customer_id}", response_model=CustomerPublic)
async def update_customer(customer_id: str, req: CustomerUpdate):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "no fields to update")
    r = await customers.update_one({"id": customer_id}, {"$set": updates})
    if r.matched_count == 0:
        raise HTTPException(404, "customer not found")
    doc = await customers.find_one({"id": customer_id}, {"_id": 0})
    return doc


@router.delete("/face/customers/{customer_id}")
async def delete_customer(customer_id: str):
    r = await customers.delete_one({"id": customer_id})
    if r.deleted_count == 0:
        raise HTTPException(404, "customer not found")
    await visits.delete_many({"customer_id": customer_id})
    return {"deleted": True}


@router.get("/face/visits", response_model=List[Visit])
async def list_visits(limit: int = 100):
    docs = await visits.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return docs


@router.get("/face/visits/export.csv")
async def export_visits_csv():
    docs = await visits.find({}, {"_id": 0}).sort("timestamp", -1).to_list(10000)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["visit_id", "customer_id", "customer_name", "timestamp", "is_new"])
    for v in docs:
        writer.writerow([v["id"], v["customer_id"], v["customer_name"], v["timestamp"], v.get("is_new", False)])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=visits.csv"},
    )


# ---------- Products ----------
@router.post("/product/classify", response_model=ProductClassification)
async def product_classify(req: ClassifyProductRequest):
    if not req.image_base64:
        raise HTTPException(400, "image_base64 is required")
    result = await classify_product(req.image_base64)
    doc = ProductClassification(
        image_base64=req.image_base64,
        filename=req.filename,
        category=result["category"],
        subcategory=result.get("subcategory"),
        confidence=result["confidence"],
        description=result.get("description"),
        customer_id=req.customer_id,
    )
    await products.insert_one(doc.model_dump())
    return doc


@router.get("/product/history", response_model=List[ProductClassification])
async def product_history(limit: int = 100):
    docs = await products.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@router.get("/product/summary")
async def product_summary():
    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    return [{"category": r["_id"], "count": r["count"]} async for r in products.aggregate(pipeline)]
