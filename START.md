# 🚀 Studymate — Project Startup Guide

## 📁 Project Structure
```
studymate_build/
├── backend/    → Express + MongoDB API (port 5000)
└── frontend/   → React + Vite UI (port 5173)
```

---

## 🔑 Step 1: Configure Environment Variables

Edit `backend/.env` and set your real OpenAI API key:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/stress-releaser
JWT_SECRET=supersecretkey_change_in_production
ADMIN_EMAIL=admin@studymate.test
YOUTUBE_API_KEY=AIzaSyCh1lDNgOO2rfD5APS-ybbhsuFvKDGYQXo
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📦 Step 2: Install Dependencies

### Backend
```powershell
cd C:\Users\DELL\Downloads\studymate_build\backend
npm install
```

### Frontend
```powershell
cd C:\Users\DELL\Downloads\studymate_build\frontend
npm install
```

---

## ▶️ Step 3: Run the Project

Open **two separate terminals**:

### Terminal 1 — Backend
```powershell
cd C:\Users\DELL\Downloads\studymate_build\backend
npm run dev
```
✅ Backend runs at: http://localhost:5000

### Terminal 2 — Frontend
```powershell
cd C:\Users\DELL\Downloads\studymate_build\frontend
npm run dev
```
✅ Frontend runs at: http://localhost:5173

---

## 🧪 Step 4: Test Quiz API

```powershell
# Replace <token>, <courseId>, <lessonId> with real values
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/quiz/generate/<courseId>/<lessonId>
```

Expected response:
```json
{
  "lessonId": "...",
  "courseId": "...",
  "lessonTitle": "...",
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A"
    }
  ]
}
```

---

## ⚠️ Prerequisites

| Requirement | Minimum Version |
|-------------|----------------|
| Node.js     | v18+            |
| MongoDB     | v6+ (running locally) |
| npm         | v9+             |

Make sure MongoDB is running before starting the backend:
```powershell
# Start MongoDB (if not running as a service)
mongod --dbpath "C:\data\db"
```
