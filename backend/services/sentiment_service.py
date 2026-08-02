"""Sentiment analysis via Gemini."""
from .llm import chat_text, _extract_json

SYSTEM = (
    "You are a strict sentiment classifier for retail customer feedback. "
    "For each input, decide if the overall sentiment is positive, negative, or neutral. "
    "Respond ONLY with a compact JSON object: "
    '{"label": "positive|negative|neutral", "confidence": 0.0-1.0}. '
    "No explanation. No extra text."
)


async def analyze_sentiment(text: str) -> dict:
    raw = await chat_text(SYSTEM, text)
    try:
        data = _extract_json(raw)
        label = str(data.get("label", "neutral")).lower().strip()
        if label not in ("positive", "negative", "neutral"):
            label = "neutral"
        conf = float(data.get("confidence", 0.7))
        conf = max(0.0, min(1.0, conf))
        return {"label": label, "confidence": conf}
    except Exception:
        # Fallback keyword heuristic
        t = text.lower()
        if any(w in t for w in ["great", "love", "excellent", "amazing", "good", "happy"]):
            return {"label": "positive", "confidence": 0.6}
        if any(w in t for w in ["bad", "terrible", "hate", "awful", "worst", "angry"]):
            return {"label": "negative", "confidence": 0.6}
        return {"label": "neutral", "confidence": 0.5}
