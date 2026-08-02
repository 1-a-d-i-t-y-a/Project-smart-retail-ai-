"""Pydantic schemas for API requests and responses."""
from datetime import datetime, timezone
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
import uuid


def _uid() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Customers / Face ----------
class RegisterFaceRequest(BaseModel):
    name: str
    image_base64: str  # data URL or raw base64


class RecognizeFaceRequest(BaseModel):
    image_base64: str


class Customer(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    image_base64: str
    created_at: str = Field(default_factory=_now)
    visit_count: int = 0
    last_seen: Optional[str] = None


class CustomerPublic(BaseModel):
    id: str
    name: str
    image_base64: str
    created_at: str
    visit_count: int
    last_seen: Optional[str] = None


class Visit(BaseModel):
    id: str = Field(default_factory=_uid)
    customer_id: str
    customer_name: str
    timestamp: str = Field(default_factory=_now)
    is_new: bool = False


class RecognizeResponse(BaseModel):
    matched: bool
    customer: Optional[CustomerPublic] = None
    confidence: float = 0.0
    visit: Optional[Visit] = None


# ---------- Sentiment ----------
class SentimentRequest(BaseModel):
    text: str
    source: Optional[str] = None  # e.g. "review", "survey"


class BulkSentimentRequest(BaseModel):
    items: List[str]


class SentimentResult(BaseModel):
    id: str = Field(default_factory=_uid)
    text: str
    label: Literal["positive", "negative", "neutral"]
    confidence: float
    source: Optional[str] = None
    created_at: str = Field(default_factory=_now)


# ---------- Chatbot ----------
class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatMessage(BaseModel):
    id: str = Field(default_factory=_uid)
    session_id: str
    role: Literal["user", "bot"]
    content: str
    intent: Optional[str] = None
    source: Literal["rule", "ai"] = "rule"
    created_at: str = Field(default_factory=_now)


class ChatResponse(BaseModel):
    reply: str
    intent: Optional[str] = None
    source: Literal["rule", "ai"]
    message_id: str


class Faq(BaseModel):
    id: str = Field(default_factory=_uid)
    tag: str
    patterns: List[str]
    responses: List[str]


class FaqCreate(BaseModel):
    tag: str
    patterns: List[str]
    responses: List[str]


# ---------- Product Classifier ----------
class ClassifyProductRequest(BaseModel):
    image_base64: str
    filename: Optional[str] = None


class ProductClassification(BaseModel):
    id: str = Field(default_factory=_uid)
    image_base64: str
    filename: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    confidence: float
    description: Optional[str] = None
    created_at: str = Field(default_factory=_now)


# ---------- Dashboard ----------
class DashboardStats(BaseModel):
    total_customers: int
    visits_today: int
    total_visits: int
    total_feedback: int
    sentiment_breakdown: dict
    chatbot_queries: int
    products_classified: int


class ActivityItem(BaseModel):
    kind: Literal["visit", "feedback", "chat", "product"]
    title: str
    detail: str
    timestamp: str
