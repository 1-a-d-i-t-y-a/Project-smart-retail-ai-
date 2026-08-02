# AI Smart Retail & Customer Intelligence Platform

A full-stack web app for retail businesses — recognise returning customers, analyse
feedback sentiment, answer FAQs via a chatbot, and classify product images. All
powered by AI, exposed through a FastAPI backend and a React dashboard.

## Modules

| Module              | Description                                                     | AI                    |
| ------------------- | --------------------------------------------------------------- | --------------------- |
| Dashboard           | Live stats, sentiment donut, visit timeline, category bar chart | —                     |
| Face Recognition    | Webcam capture → register / recognize customers + visit log     | Gemini 3 Flash Vision |
| Sentiment           | Single or bulk review classification (positive/neg/neutral)     | Gemini 3 Flash        |
| FAQ Chatbot         | Rule-based intent match with Gemini fallback + FAQ admin        | Gemini 3 Flash        |
| Product Classifier  | Drag-and-drop image → fixed retail category + confidence        | Gemini 3 Flash Vision |

## Stack

- **Frontend** — React 19 (CRA + craco), Tailwind, shadcn/ui, Recharts, react-webcam,
  react-router-dom, sonner (toast).
- **Backend** — FastAPI + Motor (async MongoDB) + Pydantic v2.
- **AI** — `emergentintegrations` library targeting `gemini-3-flash-preview` via the
  Emergent Universal LLM key (`EMERGENT_LLM_KEY`).
- **Database** — MongoDB, collections: `customers`, `visits`, `feedback`,
  `chat_messages`, `products`, `faqs`.

## API surface

All routes prefixed with `/api`. Full Swagger UI at `${BACKEND_URL}/docs`.

### Dashboard
- `GET /api/dashboard/stats` — top-level counters + sentiment split
- `GET /api/dashboard/visits-timeline?days=7`
- `GET /api/dashboard/category-distribution`
- `GET /api/dashboard/activity?limit=12`

### Sentiment
- `POST /api/sentiment/analyze` `{ text, source? }` → `SentimentResult`
- `POST /api/sentiment/bulk` `{ items: [str] }` → `SentimentResult[]`
- `GET /api/sentiment/history?limit=100`
- `GET /api/sentiment/summary`

### Chatbot
- `POST /api/chat/message` `{ session_id, message }` → `{ reply, source, intent }`
- `GET /api/chat/history/{session_id}`
- `GET /api/chat/sessions`
- `GET|POST /api/chat/faqs`, `DELETE /api/chat/faqs/{id}`

### Vision
- `POST /api/vision/face/register` `{ name, image_base64 }`
- `POST /api/vision/face/recognize` `{ image_base64 }`
- `GET /api/vision/face/customers`, `DELETE /api/vision/face/customers/{id}`
- `GET /api/vision/face/visits`
- `POST /api/vision/product/classify` `{ image_base64, filename? }`
- `GET /api/vision/product/history`
- `GET /api/vision/product/summary`

## Environment variables

`backend/.env`

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-...
```

`frontend/.env`

```
REACT_APP_BACKEND_URL=https://<host>
```

## Run

Backend, frontend and MongoDB are managed by supervisor:

```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

Interactive Swagger: `${REACT_APP_BACKEND_URL}/docs`.

## Tests

Backend integration tests live in `/app/backend/tests/backend_test.py` and exercise
every endpoint against real Gemini calls. Fixtures for face/product tests are in
`/app/test_fixtures/`.

```bash
cd /app/backend && pytest tests/backend_test.py -q
```

## Notes

- Face matching uses Gemini vision (not dlib). Great for cloud demos, but not
  biometric-grade.
- The FAQ chatbot is hybrid: it tries `data/intents.json` (plus user-added FAQs
  in Mongo) first, then falls back to Gemini.
- No auth — single-admin demo.
