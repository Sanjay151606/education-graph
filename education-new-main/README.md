# BrainGraph — AI-Powered Neurodivergent Learning Platform

> A comprehensive, ADHD-tailored educational workspace designed to reduce executive dysfunction, prevent cognitive burnout, and empower focused learning.

---

## ✨ Features

- **⚡ AI Task Breakdown & Micro-Estimates**: Deconstructs daunting, open-ended assignments into actionable 5–15 minute micro-steps.
- **📚 Study Material Simplification**: Converts complex reading materials into dyslexia- & ADHD-friendly simplified summaries, high-impact key takeaways, and active recall flashcards.
- **⏱️ Smart Focus Sessions & Burnout Detection**: Real-time focus tracking that detects chronic context switching, providing positive, non-shaming behavioral suggestions and break reminders.
- **🎯 4-Section English Proficiency & Study Calibration**: Evaluates reading, speaking, grammar, and listening comprehension to automatically calibrate personalized study pacing and sprint intervals.
- **🛡️ Secure Architecture**: Server-side AI processing and authentication ensuring sensitive keys and credentials remain secure.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite / PostgreSQL (Supabase compatible) with SQLAlchemy ORM
- **Authentication**: JWT & OAuth2 Password Bearer
- **AI Integration**: OpenAI SDK

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS & Lucide Icons
- **Speech Integration**: Web Speech API (`SpeechSynthesisUtterance` & Web Audio Recording)
- **Routing**: React Router DOM

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Sanjay151606/education-new.git
cd education-new
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 📂 Project Structure

```
education-new/
├── backend/
│   ├── app/
│   │   ├── api/          # API route endpoints
│   │   ├── core/         # Config and security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # AI and business logic
│   ├── tests/            # Pytest test suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Dashboard, Assessment, Focus pages
│   │   └── services/     # API clients
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── supabase_schema.sql  # Supabase / PostgreSQL schema
└── docs/
    └── AI_FEATURES.md       # Detailed AI documentation
```

---

## 📄 License
This project is licensed under the MIT License.
