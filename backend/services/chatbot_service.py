"""Hybrid chatbot: rule-based intents + Gemini fallback."""
import json
import random
import re
from pathlib import Path
from typing import Optional

from .llm import chat_text

INTENTS_PATH = Path(__file__).resolve().parent.parent / "data" / "intents.json"

_SYSTEM_AI = (
    "You are the friendly virtual assistant for a modern retail store. "
    "Keep answers concise (1-3 sentences), helpful, and on-topic (orders, returns, shipping, "
    "product recommendations, store info). If you don't know something specific to this store, "
    "say you'll connect them to a human agent. Never invent policies."
)


def _tokenize(s: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", s.lower()))


def load_intents() -> list[dict]:
    with open(INTENTS_PATH, "r") as f:
        data = json.load(f)
    return data.get("intents", [])


def rule_match(message: str, intents: list[dict]) -> Optional[dict]:
    tokens = _tokenize(message)
    best_score = 0.0
    best_intent = None
    for intent in intents:
        for pattern in intent.get("patterns", []):
            p_tokens = _tokenize(pattern)
            if not p_tokens:
                continue
            overlap = len(tokens & p_tokens)
            score = overlap / len(p_tokens)
            if pattern.lower() in message.lower():
                score = max(score, 0.9)
            if score > best_score:
                best_score = score
                best_intent = intent
    if best_intent and best_score >= 0.5:
        return {
            "tag": best_intent["tag"],
            "reply": random.choice(best_intent["responses"]),
            "confidence": best_score,
        }
    return None


async def generate_reply(message: str, intents: list[dict]) -> dict:
    match = rule_match(message, intents)
    if match:
        return {"reply": match["reply"], "intent": match["tag"], "source": "rule"}
    try:
        reply = await chat_text(_SYSTEM_AI, message)
        reply = reply.strip() or "I'm not sure yet — could you rephrase that?"
        return {"reply": reply, "intent": None, "source": "ai"}
    except Exception:
        return {
            "reply": "I'm having trouble reaching my knowledge base right now. Please try again in a moment.",
            "intent": None,
            "source": "ai",
        }
