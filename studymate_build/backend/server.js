const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Load Routes
const authRoutes           = require('./routes/auth');
const courseRoutes         = require('./routes/course');
const scheduleRoutes       = require('./routes/schedule');
const adminRoutes          = require('./routes/admin');
const studentCoursesRoutes = require('./routes/studentCourses');
const userChaptersRoutes   = require('./routes/userChapters');

// Routes Middleware
app.use('/api/auth',         authRoutes);
app.use('/api/course',       courseRoutes);
app.use('/api/schedule',     scheduleRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/courses',      studentCoursesRoutes);
app.use('/api/user/courses', studentCoursesRoutes);
app.use('/api',              userChaptersRoutes);

app.get('/', (req, res) => {
  res.send('StudyMate API Running');
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
