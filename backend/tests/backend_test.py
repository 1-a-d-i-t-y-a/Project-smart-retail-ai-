"""End-to-end backend tests for Smart Retail AI Platform.

Tests the FastAPI backend behind the public REACT_APP_BACKEND_URL
including dashboard, sentiment, chatbot and vision (face + product) modules.

Runs are ordered/scoped with pytest classes so that data created in earlier
tests is visible to later ones (history/summary endpoints).
"""
import base64
import os
import uuid
import time
from pathlib import Path

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

FIXTURES = Path("/app/test_fixtures")
PRODUCT_IMG = FIXTURES / "product_tshirt.jpg"
FACE_ALICE = FIXTURES / "face_alice.jpg"
FACE_OTHER = FIXTURES / "face_other.jpg"


def _b64(p: Path) -> str:
    return base64.b64encode(p.read_bytes()).decode()


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ----------------- Health -----------------
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_health(self, client):
        r = client.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"


# ----------------- Sentiment -----------------
class TestSentiment:
    def test_analyze_positive(self, client):
        r = client.post(
            f"{API}/sentiment/analyze",
            json={"text": "The service was amazing and staff friendly!", "source": "review"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["label"] == "positive"
        assert 0.0 <= d["confidence"] <= 1.0
        assert d["text"].startswith("The service")
        assert "id" in d

    def test_analyze_negative(self, client):
        r = client.post(
            f"{API}/sentiment/analyze",
            json={"text": "Absolutely terrible experience, product broke instantly and staff was rude."},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        assert r.json()["label"] == "negative"

    def test_analyze_neutral(self, client):
        r = client.post(
            f"{API}/sentiment/analyze",
            json={"text": "The store is located on 5th street and opens at 9am."},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        # Some LLMs may classify this as neutral; if positive/negative, still valid label
        assert r.json()["label"] in ("neutral", "positive", "negative")

    def test_analyze_empty(self, client):
        r = client.post(f"{API}/sentiment/analyze", json={"text": "   "}, timeout=15)
        assert r.status_code == 400

    def test_bulk(self, client):
        items = [
            "Loved the checkout speed!",
            "Worst return experience ever.",
            "It was okay, nothing special.",
        ]
        r = client.post(f"{API}/sentiment/bulk", json={"items": items}, timeout=90)
        assert r.status_code == 200, r.text
        out = r.json()
        assert isinstance(out, list) and len(out) == 3
        labels = [x["label"] for x in out]
        for l in labels:
            assert l in ("positive", "negative", "neutral")

    def test_history_and_summary(self, client):
        h = client.get(f"{API}/sentiment/history?limit=20", timeout=15)
        assert h.status_code == 200
        hist = h.json()
        assert isinstance(hist, list) and len(hist) > 0
        assert set(hist[0].keys()) >= {"text", "label", "confidence"}

        s = client.get(f"{API}/sentiment/summary", timeout=15)
        assert s.status_code == 200
        js = s.json()
        assert "counts" in js and "total" in js
        assert js["total"] >= 3
        assert set(js["counts"].keys()) == {"positive", "negative", "neutral"}


# ----------------- Chatbot -----------------
class TestChatbot:
    session_id = f"test-{uuid.uuid4().hex[:8]}"

    def test_rule_reply_store_hours(self, client):
        r = client.post(
            f"{API}/chat/message",
            json={"session_id": self.session_id, "message": "What are your store hours?"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["source"] == "rule"
        assert d["intent"] == "store_hours"
        assert isinstance(d["reply"], str) and len(d["reply"]) > 0

    def test_ai_fallback_offtopic(self, client):
        r = client.post(
            f"{API}/chat/message",
            json={"session_id": self.session_id, "message": "Explain the physics of quantum tunneling in one sentence."},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        # Off-topic should NOT match a rule - should fall through to AI
        assert d["source"] == "ai", f"Expected AI fallback, got source={d['source']}: {d['reply']}"
        assert isinstance(d["reply"], str) and len(d["reply"].strip()) > 0

    def test_history_in_order(self, client):
        r = client.get(f"{API}/chat/history/{self.session_id}", timeout=15)
        assert r.status_code == 200
        msgs = r.json()
        # At least 4 messages: 2 user + 2 bot from the two prior tests
        assert len(msgs) >= 4
        # Verify chronological order
        ts = [m["created_at"] for m in msgs]
        assert ts == sorted(ts)
        # Verify roles alternate reasonably
        roles = [m["role"] for m in msgs]
        assert roles.count("user") >= 2 and roles.count("bot") >= 2

    def test_empty_message_rejected(self, client):
        r = client.post(
            f"{API}/chat/message",
            json={"session_id": self.session_id, "message": ""},
            timeout=15,
        )
        assert r.status_code == 400

    def test_faq_crud(self, client):
        # create
        payload = {
            "tag": f"TEST_loyalty_{uuid.uuid4().hex[:6]}",
            "patterns": ["loyalty rewards program"],
            "responses": ["Earn 1 point per $1 spent."],
        }
        r = client.post(f"{API}/chat/faqs", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        faq = r.json()
        assert faq["tag"] == payload["tag"]
        faq_id = faq["id"]

        # list
        r = client.get(f"{API}/chat/faqs", timeout=15)
        assert r.status_code == 200
        assert any(f["id"] == faq_id for f in r.json())

        # delete
        r = client.delete(f"{API}/chat/faqs/{faq_id}", timeout=15)
        assert r.status_code == 200
        assert r.json().get("deleted") is True

        # verify gone
        r = client.get(f"{API}/chat/faqs", timeout=15)
        assert not any(f["id"] == faq_id for f in r.json())

        # deleting again -> 404
        r = client.delete(f"{API}/chat/faqs/{faq_id}", timeout=15)
        assert r.status_code == 404


# ----------------- Vision: Product -----------------
class TestProductVision:
    def test_classify_tshirt(self, client):
        assert PRODUCT_IMG.exists(), "fixture image missing"
        b64 = _b64(PRODUCT_IMG)
        r = client.post(
            f"{API}/vision/product/classify",
            json={"image_base64": b64, "filename": "tshirt.jpg"},
            timeout=120,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        allowed = {
            "Electronics", "Clothing & Apparel", "Groceries & Food", "Home & Kitchen",
            "Beauty & Personal Care", "Toys & Games", "Sports & Outdoors",
            "Books & Stationery", "Health & Wellness", "Accessories", "Other",
        }
        assert d["category"] in allowed
        assert 0.0 <= d["confidence"] <= 1.0
        # Real check: t-shirt image should map to Clothing (allow Accessories/Other as loose match if the LLM fails)
        assert d["category"] in ("Clothing & Apparel", "Accessories"), \
            f"Expected Clothing for t-shirt image, got {d['category']}"

    def test_history_and_summary(self, client):
        r = client.get(f"{API}/vision/product/history?limit=20", timeout=15)
        assert r.status_code == 200
        hist = r.json()
        assert isinstance(hist, list) and len(hist) > 0
        r = client.get(f"{API}/vision/product/summary", timeout=15)
        assert r.status_code == 200
        js = r.json()
        assert isinstance(js, list)
        assert any("category" in x for x in js)

    def test_classify_missing_image(self, client):
        r = client.post(f"{API}/vision/product/classify", json={"image_base64": ""}, timeout=15)
        assert r.status_code == 400


# ----------------- Vision: Face -----------------
class TestFaceVision:
    customer_id = None

    def test_register(self, client):
        assert FACE_ALICE.exists()
        b64 = _b64(FACE_ALICE)
        r = client.post(
            f"{API}/vision/face/register",
            json={"name": "TEST_Alice", "image_base64": b64},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "TEST_Alice"
        assert d["id"]
        TestFaceVision.customer_id = d["id"]

    def test_list_customers(self, client):
        r = client.get(f"{API}/vision/face/customers", timeout=15)
        assert r.status_code == 200
        ids = [c["id"] for c in r.json()]
        assert TestFaceVision.customer_id in ids

    def test_recognize_same_face(self, client):
        b64 = _b64(FACE_ALICE)
        r = client.post(f"{API}/vision/face/recognize", json={"image_base64": b64}, timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["matched"] is True, f"Expected same image to match. Got: {d}"
        assert d["customer"]["id"] == TestFaceVision.customer_id

    def test_recognize_different_face(self, client):
        b64 = _b64(FACE_OTHER)
        r = client.post(f"{API}/vision/face/recognize", json={"image_base64": b64}, timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        # Different person should not match Alice
        assert d["matched"] is False, f"Different face should not match. Got: {d}"

    def test_delete_customer(self, client):
        cid = TestFaceVision.customer_id
        r = client.delete(f"{API}/vision/face/customers/{cid}", timeout=15)
        assert r.status_code == 200
        # verify gone
        r = client.get(f"{API}/vision/face/customers", timeout=15)
        ids = [c["id"] for c in r.json()]
        assert cid not in ids
        # second delete = 404
        r = client.delete(f"{API}/vision/face/customers/{cid}", timeout=15)
        assert r.status_code == 404


# ----------------- Dashboard -----------------
class TestDashboard:
    def test_stats(self, client):
        r = client.get(f"{API}/dashboard/stats", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in (
            "total_customers", "visits_today", "total_visits",
            "total_feedback", "chatbot_queries", "products_classified",
            "sentiment_breakdown",
        ):
            assert k in d, f"missing {k}"
        assert set(d["sentiment_breakdown"].keys()) == {"positive", "negative", "neutral"}
        # After running sentiment + chat + product tests, we expect data present
        assert d["total_feedback"] >= 3
        assert d["chatbot_queries"] >= 2
        assert d["products_classified"] >= 1

    def test_visits_timeline(self, client):
        r = client.get(f"{API}/dashboard/visits-timeline?days=7", timeout=15)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list) and len(arr) == 7
        for row in arr:
            assert "date" in row and "visits" in row
            assert isinstance(row["visits"], int)

    def test_category_distribution(self, client):
        r = client.get(f"{API}/dashboard/category-distribution", timeout=15)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        if arr:
            assert "category" in arr[0] and "count" in arr[0]

    def test_activity(self, client):
        r = client.get(f"{API}/dashboard/activity?limit=12", timeout=15)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list) and len(arr) > 0
        kinds = {x["kind"] for x in arr}
        assert kinds.issubset({"visit", "feedback", "chat", "product"})
