# Image Integration Testing Playbook

## Rules
- Always use base64-encoded images for tests.
- Accepted formats: JPEG, PNG, WEBP only.
- Do not use SVG, BMP, HEIC.
- Do not send blank or solid-color images — must have real edges/textures.
- If image not PNG/JPEG/WEBP, transcode first.
- If GIF/APNG/animated WEBP: extract first frame.
- Resize very large images before upload.
- After any conversion, re-check MIME type before submitting.

Endpoints exercising vision:
- POST /api/vision/product/classify  (body: { image_base64, filename? })
- POST /api/vision/face/register     (body: { name, image_base64 })
- POST /api/vision/face/recognize    (body: { image_base64 })

All accept either data URLs ("data:image/jpeg;base64,...") or raw base64.
