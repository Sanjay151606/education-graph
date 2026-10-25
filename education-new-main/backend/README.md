# BrainGraph — Backend (FastAPI)

## Setup
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in Supabase + JWT + AI keys
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## Structure
- `app/models.py` – SQLAlchemy models (mirrors Supabase Postgres tables)
- `app/routers/` – auth, tasks, study_materials, progress, ai_recommendations
- `app/services/ai_service.py` – all LLM calls (simplify text, break down tasks, recommendations)
- `app/auth.py` – JWT login/register
