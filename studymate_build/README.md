# StudyMate — MERN Stack Learning Platform

## Project Structure
```
studymate/
├── backend/      ← Express + MongoDB API
└── frontend/     ← React + Vite UI
```

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017

---

### Step 1 — Setup Backend

```bash
cd backend
npm install
```

Create admin account (run once):
```bash
node createAdmin.js
```
Admin credentials: admin@studymate.test / admin@123

Start main API server:
```bash
npm run dev
# Runs on http://localhost:5000
```

Start YouTube playlist server (separate terminal):
```bash
node playlistServer.js
# Runs on http://localhost:5001
```

---

### Step 2 — Setup Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## API Endpoints

### Auth
| Method | Route | Access |
|--------|-------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |

### Courses
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/course | Auth |
| POST | /api/course | Admin |
| PUT | /api/course/:id | Admin |
| DELETE | /api/course/:id | Admin |
| POST | /api/course/:id/import-playlist | Admin |
| PATCH | /api/course/:id/topic/:topicId/toggle | Student |

### Schedule
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/schedule/generate | Auth |
| GET | /api/schedule/availability | Auth |
| POST | /api/schedule/availability | Auth |
| GET | /api/schedule/smart | Auth |
| POST | /api/schedule/generate-smart | Auth |
| PATCH | /api/schedule/task/:taskId | Auth |

### Admin
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/admin/users | Admin |
| PATCH | /api/admin/users/:id | Admin |
| DELETE | /api/admin/users/:id | Admin |
| GET | /api/admin/courses | Admin |
| GET | /api/admin/overview | Admin |

---

## Features Built

| # | Feature | Status |
|---|---------|--------|
| 1 | Authentication (Login/Register) | ✅ Complete |
| 2 | Course Management + Playlist Import | ✅ Complete |
| 3 | Role-Based Access Control | ✅ Complete |
| 4 | Course Progress Tracking | ✅ Complete |
| 5 | Smart Schedule Page | ✅ Complete |
| 6 | Student Dashboard | 🚧 Placeholder |
| 7 | Quiz System | 🚧 Placeholder |
| 8 | Admin Analytics Dashboard | 🚧 Placeholder |

---

## Roles
- **Admin**: Create/Edit/Delete courses, Import YouTube playlists, Manage users
- **Student**: View courses, Mark topics complete, Generate study schedule
