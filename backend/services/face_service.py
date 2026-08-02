"""Face recognition using Gemini Vision to compare a probe image against
registered customer photos. Not as precise as dlib embeddings but works in
cloud environments without heavy native deps."""
from typing import Optional
from .llm import chat_vision_multi, _extract_json

SYSTEM = (
    "You are a face matching assistant for a small retail store. You will be shown a probe "
    "photo (the FIRST image) and a numbered gallery of previously registered customers "
    "(subsequent images). Decide if the probe photo shows the SAME PERSON as any of the "
    "gallery photos. Focus on stable facial features (bone structure, eyes, nose, mouth shape). "
    "Ignore lighting, angle, expression, glasses, and hair changes. Be conservative — if unsure, "
    "return match=false.\n\n"
    'Respond ONLY as compact JSON: {"match": true|false, "index": <int or -1>, '
    '"confidence": 0.0-1.0, "reason": "short"}. index is the 1-based gallery position; '
    "-1 when match is false."
)


async def match_face(probe_b64: str, gallery: list[dict]) -> dict:
    """gallery is a list of {"id","name","image_base64"}. Returns dict with
    match, index, confidence, matched_id."""
    if not gallery:
        return {"match": False, "confidence": 0.0, "matched_id": None}

    images = [probe_b64] + [g["image_base64"] for g in gallery]
    numbered_names = ", ".join(f"{i+1}={g['name']}" for i, g in enumerate(gallery))
    prompt = (
        f"Gallery of {len(gallery)} registered customer(s): {numbered_names}. "
        "Compare the probe (image 1) with each gallery image and return your JSON verdict."
    )
    try:
        raw = await chat_vision_multi(SYSTEM, prompt, images)
        data = _extract_json(raw)
        matched = bool(data.get("match", False))
        idx = int(data.get("index", -1))
        conf = max(0.0, min(1.0, float(data.get("confidence", 0.0))))
        if matched and 1 <= idx <= len(gallery) and conf >= 0.55:
            return {
                "match": True,
                "confidence": conf,
                "matched_id": gallery[idx - 1]["id"],
                "matched_name": gallery[idx - 1]["name"],
            }
        return {"match": False, "confidence": conf, "matched_id": None}
    except Exception:
        return {"match": False, "confidence": 0.0, "matched_id": None}
