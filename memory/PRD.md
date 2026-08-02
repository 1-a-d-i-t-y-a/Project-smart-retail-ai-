# Smart Retail AI Platform - PRD

## Original Problem Statement
Full-stack Smart Retail & Customer Intelligence Platform with 5 AI modules:
Face recognition (webcam), Sentiment analysis, FAQ chatbot, Product classifier,
Unified analytics dashboard.

## Architecture
- Backend: FastAPI (`/app/backend/server.py`) with routers under `/api`
  - `routers/vision.py` — face + product endpoints
  - `routers/sentiment.py` — sentiment analysis endpoints
  - `routers/chatbot.py` — hybrid rule + AI chatbot
  - `routers/dashboard.py` — aggregate stats
  - `services/llm.py` — shared LLM helper (Gemini 3 Flash via emergentintegrations)
  - `services/{face,sentiment,product,chatbot}_service.py` — module logic
  - `data/intents.json` — pre-loaded retail FAQ patterns
  - MongoDB collections: customers, visits, feedback, chat_messages, products, faqs
- Frontend: React + Tailwind + shadcn/ui + Recharts + react-webcam
  - Dark slate + rose accent theme (Outfit/Manrope fonts)
  - Routes: `/`, `/face`, `/sentiment`, `/chatbot`, `/products`

## User Personas
- Retail/e-commerce store owner (primary)
- Customer support manager
- Academic evaluator (capstone demo)

## Core Requirements (static)
- Face recognition via webcam with register/recognize (Gemini Vision matching)
- Sentiment analysis for single + bulk reviews (Gemini text)
- FAQ chatbot: rule match first, AI fallback (Gemini)
- Product image classifier with fixed taxonomy (Gemini Vision)
- Unified dashboard with charts (Recharts): visits timeline, sentiment donut, category bar
- Recent activity feed, customer list, visit log, classification history
- Admin CRUD for custom FAQ entries

## Implemented (2026-02)
- All 4 AI modules end-to-end with MongoDB persistence
- Dashboard aggregates + charts
- Custom FAQ admin
- Dark themed dashboard UI with sidebar navigation, live webcam preview with scanlines + brackets, drag-drop dropzone, chat UI with distinct bubble styles per role
- Uses EMERGENT_LLM_KEY for all Gemini calls
- All interactive elements have data-testid

## Prioritized Backlog
- P1: Add visit chart on Face page and per-customer visit drill-down
- P1: Sentiment auto-analysis of latest feedback stream (WebSocket)
- P2: CSV export of feedback + visits
- P2: Voice input for chatbot
- P2: Multi-tenant admin auth (JWT)
- P2: Docker + cloud deployment recipe
