# [SUPERSEDED] AI Smart Retail & Customer Intelligence Platform

> ⚠️ **ARCHIVE & DEPRECATION NOTICE:**  
> This repository represents an early cloud-assisted prototype and has been **superseded** by the canonical, production-ready, offline-first machine learning platform:  
> 👉 **[https://github.com/1-a-d-i-t-y-a/smart-retail-ai](https://github.com/1-a-d-i-t-y-a/smart-retail-ai)**  
>  
> Please refer to `smart-retail-ai` for active development, verifiable local model training (HOG + SVM, Haar Cascades, SSIM, TF-IDF), Docker orchestration, and automated CI test suites.

---

## Historical Prototype Overview

This repository was an exploratory full-stack prototype combining a React dashboard with a FastAPI and MongoDB backend, utilizing cloud-hosted vision and language models.

### Architecture Differences vs Canonical Flagship

| Dimension | `Project-smart-retail-ai-` (This Prototype) | `smart-retail-ai` (Canonical Flagship) |
| :--- | :--- | :--- |
| **Status** | Deprecated Prototype (August 2026) | **Active Flagship Platform** (September 2026+) |
| **AI / ML Execution** | Proprietary cloud LLM API calls | **Local, deterministic machine learning models** |
| **Model Types** | Remote multimodal cloud prompt calls | HOG + RBF SVM, Haar Cascades + SSIM, TF-IDF + Logistic Regression |
| **Reproducibility** | Requires cloud agent environment & keys | **100% offline reproducible with zero paid API keys** |
| **Testing & CI** | Incomplete test fixtures | **24 automated Pytest cases with GitHub Actions CI** |
| **Containerization** | Platform-specific cloud configuration | Standard production `Dockerfile` & `docker-compose.yml` |

---

## Prototype Stack (For Reference)

* **Frontend:** React 19, Tailwind CSS, shadcn/ui, Recharts
* **Backend:** FastAPI, Motor (Async MongoDB), Pydantic v2
* **Original Host:** Emergent agent environment
