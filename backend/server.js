const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ─── Load Routes ──────────────────────────────────────────────────────────────
const authRoutes           = require('./routes/auth');
const courseRoutes         = require('./routes/course');       // admin: create/edit/delete/import
const scheduleRoutes       = require('./routes/schedule');
const adminRoutes          = require('./routes/admin');
const allCoursesRoutes     = require('./routes/allCourses');   // GET /api/courses → all courses for students
const studentCoursesRoutes = require('./routes/studentCourses'); // GET+POST /api/student-courses
const userChaptersRoutes   = require('./routes/userChapters');
const quizRoutes           = require('./routes/quiz');         // GET /api/quiz/generate/:courseId/:lessonId
const availabilityRoutes   = require('./routes/availability'); // GET|POST /api/availability

// ─── Mount Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/course',          courseRoutes);        // admin course management
app.use('/api/courses',         allCoursesRoutes);    // student: browse all courses
app.use('/api/student-courses', studentCoursesRoutes); // student: my courses
app.use('/api/schedule',        scheduleRoutes);
app.use('/api/admin',           adminRoutes);
app.use('/api',                 userChaptersRoutes);
app.use('/api/quiz',            quizRoutes);          // quiz generation via Gemini
app.use('/api/availability',    availabilityRoutes);  // weekly study hours

app.get('/', (req, res) => {
  res.send('StudyMate API is running...');
});

// ─── Database Connection ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    // NOTE: No predefined course seeding.
    // Admin imports courses via YouTube playlist.
    // Students select from whatever admin has imported.
  })
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
