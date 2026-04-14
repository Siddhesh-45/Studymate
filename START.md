# 🚀 StudyMate — How to Run the Project

> ⚠️ IMPORTANT: The real project lives at the **ROOT** of this folder.
> Always run commands from `studymate_build\backend` and `studymate_build\frontend`
> NOT from the nested `studymate_build\studymate_build\` folder (that is an incomplete copy).

---

## 📁 Correct Project Paths

| Service         | Correct Path                                              |
|-----------------|-----------------------------------------------------------|
| Backend API     | `C:\Users\DELL\Downloads\studymate_build\backend`         |
| Playlist Server | `C:\Users\DELL\Downloads\studymate_build\backend`         |
| Frontend UI     | `C:\Users\DELL\Downloads\studymate_build\frontend`        |

---

## ✅ First-Time Setup (Run Once)

If `node_modules` is missing in any folder, install dependencies first:

```powershell
# Backend
cd C:\Users\DELL\Downloads\studymate_build\backend
npm install

# Frontend
cd C:\Users\DELL\Downloads\studymate_build\frontend
npm install
```

---

## 🖥️ Terminal 1 — Main Backend API
> Runs on: http://localhost:5000

```powershell
cd C:\Users\DELL\Downloads\studymate_build\backend
npm run dev
```

✅ Success message: `Server running on port 5000` + `MongoDB connected successfully`

---

## 🎬 Terminal 2 — YouTube Playlist Server
> Runs on: http://localhost:5001

```powershell
cd C:\Users\DELL\Downloads\studymate_build\backend
node playlistServer.js
```

✅ Success message: `Server running on http://localhost:5001`

---

## 🌐 Terminal 3 — Frontend UI
> Runs on: http://localhost:5173

```powershell
cd C:\Users\DELL\Downloads\studymate_build\frontend
npm run dev
```

✅ Success message: `VITE v5.x.x  ready in Xms` → `Local: http://localhost:5173/`

---

## 🌍 Access the App

| Service             | URL                        |
|---------------------|----------------------------|
| 🌐 Frontend App     | http://localhost:5173      |
| 🔌 Backend REST API | http://localhost:5000      |
| 🎬 Playlist API     | http://localhost:5001      |

---

## ⚠️ Common Issues & Fixes

| Error                                   | Fix                                              |
|-----------------------------------------|--------------------------------------------------|
| `Cannot find module 'vite/bin/vite.js'` | Run `npm install` inside the `frontend` folder   |
| `Cannot find module 'nodemon'`          | Run `npm install` inside the `backend` folder    |
| MongoDB connection error                | Make sure MongoDB is running locally on port 27017|
| Blank white/dark screen on frontend     | You're in wrong folder — check path above        |
| Port already in use                     | Run: `Get-Process -Name node \| Stop-Process -Force` |

---

## 🔑 Environment Variables (backend/.env)

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/stress-releaser
JWT_SECRET=supersecretkey_change_in_production
ADMIN_EMAIL=admin@studymate.test
YOUTUBE_API_KEY=AIzaSyCh1lDNgOO2rfD5APS-ybbhsuFvKDGYQXo
GEMINI_API_KEY=AIzaSyALc72ldpPgiwDGzwS1zaD4bS9KuECv4X8
```
