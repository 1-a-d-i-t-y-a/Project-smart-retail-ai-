"""FAQ chatbot routes."""
from fastapi import APIRouter, HTTPException
from typing import List

from schemas import ChatRequest, ChatResponse, ChatMessage, Faq, FaqCreate
from services.chatbot_service import load_intents, generate_reply
from db import chat_messages, faqs

router = APIRouter(prefix="/chat", tags=["chatbot"])


@router.post("/message", response_model=ChatResponse)
async def send_message(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(400, "message is required")

    intents = load_intents()
    # Merge in dynamic FAQs stored in Mongo
    dynamic = await faqs.find({}, {"_id": 0}).to_list(500)
    intents = intents + [
        {"tag": f["tag"], "patterns": f["patterns"], "responses": f["responses"]}
        for f in dynamic
    ]

    user_msg = ChatMessage(session_id=req.session_id, role="user", content=req.message)
    await chat_messages.insert_one(user_msg.model_dump())

    result = await generate_reply(req.message, intents)
    bot_msg = ChatMessage(
        session_id=req.session_id,
        role="bot",
        content=result["reply"],
        intent=result.get("intent"),
        source=result["source"],
    )
    await chat_messages.insert_one(bot_msg.model_dump())

    return ChatResponse(
        reply=result["reply"],
        intent=result.get("intent"),
        source=result["source"],
        message_id=bot_msg.id,
    )


@router.get("/history/{session_id}", response_model=List[ChatMessage])
async def history(session_id: str):
    items = await chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return items


@router.get("/sessions")
async def list_sessions():
    pipeline = [
        {"$group": {"_id": "$session_id", "last": {"$max": "$created_at"}, "count": {"$sum": 1}}},
        {"$sort": {"last": -1}},
        {"$limit": 50},
    ]
    out = []
    async for row in chat_messages.aggregate(pipeline):
        out.append({"session_id": row["_id"], "last_active": row["last"], "message_count": row["count"]})
    return out


@router.get("/faqs", response_model=List[Faq])
async def list_faqs():
    return await faqs.find({}, {"_id": 0}).to_list(500)


@router.post("/faqs", response_model=Faq)
async def add_faq(req: FaqCreate):
    doc = Faq(**req.model_dump())
    await faqs.insert_one(doc.model_dump())
    return doc


@router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str):
    r = await faqs.delete_one({"id": faq_id})
    if r.deleted_count == 0:
        raise HTTPException(404, "FAQ not found")
    return {"deleted": True}
