# ModalTani — PRD (Prototype)

## Original Problem Statement
Build a hackathon prototype named **ModalTani** — an AI-powered edutech platform for small-holder farmers in rural Indonesia. Two roles:
- **Petani (Farmer)**: audio-visual PLEK Kementan learning modules + AI KUR advisory chat.
- **Admin Bank Mitra**: CRM dashboard with rule-based credit scoring & knowledge-base management.

Tech: FastAPI + MongoDB + React (Tailwind + shadcn) + Google Gemini (via Emergent LLM key). Demo auth only.

## Architecture
- **Backend** `/app/backend/server.py`
  - REST prefixed `/api`, MongoDB via `MONGO_URL`, seed on startup.
  - Gemini RAG: keyword-weighted retrieval → LLM prompt with sources → high-fidelity fallback if LLM offline.
  - Deterministic 4-pillar credit scoring: Luas Lahan, Riwayat Panen, Edukasi ModalTani, Dokumen (each 0-25).
  - Knowledge Base CRUD (`GET/POST/DELETE /api/kur-docs`) so bank admin can grow RAG sources.
- **Frontend** `/app/frontend/src/`
  - `App.js` — central demo-auth state & routing switch (landing/modules/chat/crm/kb).
  - Views: LandingView, LearningModulesView, ChatAdvisoryView, CRMDashboardView (with KB tab).
  - Components: Navbar, AuthModal, PretestModal, ModulePlayerModal, FarmerDetailDrawer, AddFarmerModal.
  - Recharts for score distribution, sonner for toasts, lucide-react icons.

## User Personas
1. **Pak Budi / Bu Siti (Petani Desa)** — smallholder farmer, low digital literacy, wants easy modules + trustworthy KUR info.
2. **Bambang Prakoso (Analis Bank Mitra)** — reviews candidates, verifies documents, curates official KUR sources for RAG.

## Core Requirements (Static)
- Demo login (dropdown role switch, no password).
- 3 PLEK Kementan modules with pretest & quiz.
- RAG KUR advisory chat with source-citation badge.
- CRM dashboard with 4-pillar credit scoring, filtering, chart, document verification.
- Knowledge base manager for RAG sources.

## Implemented (Feb 2026)
- ✅ Backend: users, farmer_profiles, modules, pretest, learning_progress, chat (RAG), credit scoring, KB CRUD.
- ✅ Seed data: 6 farmers, 3 PLEK modules, 5 pretest Qs, 8 KUR knowledge base docs.
- ✅ Landing page (agrarian aesthetic, hero, 3-problem section, 3-feature cards).
- ✅ Learning Modules view (pretest banner, category tabs, module grid, progress badge).
- ✅ Chat Advisory view (RAG chat + source badge + quick prompts + optional voice input).
- ✅ CRM Dashboard (KPI cards, recharts bar, insight panel, filter, farmer table, drawer).
- ✅ Knowledge Base Manager (list + add form modal + delete, stats bar).
- ✅ Demo Auth Modal + Role Selector Navbar.

## Backlog / Next Tasks
- **P1** Quiz answers persistence + adaptive re-ordering by pretest level.
- **P1** Real audio narration for modules (elevenLabs TTS) instead of placeholder video.
- **P2** Qdrant vector store integration (currently keyword-weighted retrieval; user will migrate).
- **P2** WhatsApp Business API notification to farmers when score improves.
- **P2** Multi-tenant bank switching (currently single bank instance).

## Test Credentials
Demo mode: no password. Choose any user from navbar dropdown.
- Petani: `Budi Hartono`, `Siti Aminah`, `Joko Susilo`, `Herman Wijaya`, `Dewi Lestari`, `I Wayan Sudirta`.
- Admin Bank: `Bambang Prakoso (Analis Kredit Mitra Bank)`.
