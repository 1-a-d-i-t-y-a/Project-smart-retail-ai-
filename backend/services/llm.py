"""Shared LLM helpers using emergentintegrations."""
import os
import base64
import json
import re
import tempfile
import uuid
from typing import Optional

from emergentintegrations.llm.chat import (
    LlmChat,
    UserMessage,
    FileContentWithMimeType,
)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
GEMINI_MODEL = "gemini-3-flash-preview"


def _new_chat(system_message: str, session_id: Optional[str] = None) -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id or str(uuid.uuid4()),
        system_message=system_message,
    ).with_model("gemini", GEMINI_MODEL)


def _strip_data_url(image_b64: str) -> tuple[str, str]:
    """Return (mime, base64) parsed from data URL if present, else default jpeg."""
    m = re.match(r"data:(image/(?:png|jpeg|jpg|webp));base64,(.*)$", image_b64)
    if m:
        mime = m.group(1)
        if mime == "image/jpg":
            mime = "image/jpeg"
        return mime, m.group(2)
    return "image/jpeg", image_b64


def _write_temp_image(image_b64: str) -> tuple[str, str]:
    """Decode a base64/data-URL image and write it to a temp file. Return (path, mime)."""
    mime, raw = _strip_data_url(image_b64)
    ext = {"image/png": ".png", "image/webp": ".webp"}.get(mime, ".jpg")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    tmp.write(base64.b64decode(raw))
    tmp.flush()
    tmp.close()
    return tmp.name, mime


def _extract_json(text: str) -> dict:
    """Best-effort JSON extraction from an LLM response."""
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence:
        text = fence.group(1)
    else:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            text = m.group(0)
    return json.loads(text)


async def chat_text(system_message: str, user_text: str, session_id: Optional[str] = None) -> str:
    chat = _new_chat(system_message, session_id)
    resp = await chat.send_message(UserMessage(text=user_text))
    return resp if isinstance(resp, str) else str(resp)


async def chat_vision(system_message: str, user_text: str, image_b64: str) -> str:
    path, mime = _write_temp_image(image_b64)
    try:
        chat = _new_chat(system_message)
        resp = await chat.send_message(
            UserMessage(
                text=user_text,
                file_contents=[FileContentWithMimeType(file_path=path, mime_type=mime)],
            )
        )
        return resp if isinstance(resp, str) else str(resp)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


async def chat_vision_multi(system_message: str, user_text: str, images_b64: list[str]) -> str:
    """Send multiple images in a single vision call."""
    paths_mimes = [_write_temp_image(b) for b in images_b64]
    try:
        chat = _new_chat(system_message)
        resp = await chat.send_message(
            UserMessage(
                text=user_text,
                file_contents=[FileContentWithMimeType(file_path=p, mime_type=m) for p, m in paths_mimes],
            )
        )
        return resp if isinstance(resp, str) else str(resp)
    finally:
        for p, _ in paths_mimes:
            try:
                os.unlink(p)
            except OSError:
                pass
