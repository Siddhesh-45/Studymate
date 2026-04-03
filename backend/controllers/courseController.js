const Course         = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/course  — available to ALL logged-in users
// Admin  → sees all courses
// Student → sees only approved courses
// ─────────────────────────────────────────────────────────────────────────────
exports.getCourses = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { status: 'approved' };
    const courses = await Course.find(query);
    res.json(courses);
  } catch (err) {
    console.error('getCourses error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/course/admin  — admin only (guarded at route level)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllCoursesAdmin = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    const courses = await Course.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ courses });
  } catch (err) {
    console.error('getAllCoursesAdmin error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/course  — admin only (guarded at route level)
// ─────────────────────────────────────────────────────────────────────────────
exports.createCourse = async (req, res) => {
  try {
    const { courseName, topics, description } = req.body;
    const newCourse = new Course({
      userId: req.user.id,
      courseName,
      description: description || '',
      topics: topics || [],
      status: 'approved',
      isActive: false,
    });
    const saved = await newCourse.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('createCourse error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/course/:id  — admin only (guarded at route level)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateCourse = async (req, res) => {
  try {
    const { courseName, topics } = req.body;
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { courseName, topics } },
      { new: true, runValidators: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    console.error('updateCourse error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/course/:id/topic/:topicId/toggle  — student only
//
// Does TWO things in one call:
//   1. Toggles topic.status (pending ↔ completed) inside the Course document
//   2. Upserts a CourseProgress record for this student + course
//      so analytics always has fresh data
//
// CourseProgress fields updated:
//   completedLessons    → count of topics with status === 'completed'
//   totalLessons        → course.topics.length
//   completionPercentage → (completedLessons / totalLessons) * 100
//   lastAccessedAt      → now
// ─────────────────────────────────────────────────────────────────────────────
exports.toggleTopicStatus = async (req, res) => {
  try {
    const userId   = req.user.id;
    const courseId = req.params.id;
    const topicId  = req.params.topicId;

    // ── Step 1: Find the course ──────────────────────────────────────────────
    const course = await Course.findOne({ _id: courseId, status: 'approved' });
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // ── Step 2: Find the specific topic inside the course ───────────────────
    // Mongoose subdocument helper — finds by _id inside an array
    const topic = course.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found.' });
    }

    // ── Step 3: Flip the topic status ────────────────────────────────────────
    const newStatus = topic.status === 'completed' ? 'pending' : 'completed';
    topic.status    = newStatus;

    // Save the updated course document (topic is embedded, so course.save() handles it)
    await course.save();

    // ── Step 4: Recalculate progress numbers for this student + course ───────
    const totalLessons     = course.topics.length;
    const completedLessons = course.topics.filter((t) => t.status === 'completed').length;
    const completionPercentage =
      totalLessons > 0
        ? parseFloat(((completedLessons / totalLessons) * 100).toFixed(2))
        : 0;

    // ── Step 5: Upsert CourseProgress record ─────────────────────────────────
    // findOneAndUpdate with upsert: true
    //   → If record exists for this { userId, courseId } → update it
    //   → If no record exists yet → create it automatically (first time a student touches this course)
    const progressRecord = await CourseProgress.findOneAndUpdate(
      { userId, courseId },               // filter: find by student + course
      {
        $set: {
          completedLessons,
          totalLessons,
          completionPercentage,
          lastAccessedAt: new Date(),
        },
      },
      {
        new:    true,   // return the updated document
        upsert: true,   // create if it doesn't exist
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      `[toggleTopic] User:${userId} Course:${courseId} Topic:${topicId}` +
      ` → ${newStatus} | Progress: ${completedLessons}/${totalLessons} (${completionPercentage}%)`
    );

    // ── Step 6: Return everything the frontend needs ─────────────────────────
    res.json({
      message:             `Topic marked as ${newStatus}`,
      topicId:             topic._id,
      status:              newStatus,
      progress: {
        completedLessons,
        totalLessons,
        completionPercentage,
      },
    });

  } catch (err) {
    console.error('toggleTopicStatus error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/course/:id  — admin only (guarded at route level)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('deleteCourse error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper — calls the YouTube Data API directly
// ─────────────────────────────────────────────────────────────────────────────
async function fetchPlaylistVideos(playlistUrl) {
  const axios = require('axios');
  
  // Extract Playlist ID
  const regex = /[?&]list=([^#\&\?]+)/;
  const match = playlistUrl.match(regex);
  const playlistId = match ? match[1] : null;

  if (!playlistId) throw new Error('Invalid Playlist URL: Missing list parameter');

  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyCh1lDNgOO2rfD5APS-ybbhsuFvKDGYQXo";

  const response = await axios.get(
    `https://www.googleapis.com/youtube/v3/playlistItems`,
    {
      params: {
        part: "snippet",
        maxResults: 50,
        playlistId: playlistId,
        key: YOUTUBE_API_KEY,
      },
    }
  );

  return response.data.items.map((item) => ({
    title: item.snippet.title,
    videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/course/:id/import-playlist  — admin only (guarded at route level)
// ─────────────────────────────────────────────────────────────────────────────
exports.importPlaylistToCourse = async (req, res) => {
  try {
    const { playlistUrl, replaceTopics } = req.body;
    if (!playlistUrl) {
      return res.status(400).json({ message: 'playlistUrl is required.' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    console.log(`[importPlaylist] Fetching for: ${course.courseName}`);
    const videos = await fetchPlaylistVideos(playlistUrl);

    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(502).json({ message: 'No videos found. Is the playlist public?' });
    }

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const importedTopics   = videos.map((v) => ({
      title: v.title, youtubeUrl: v.videoUrl, article: '',
      deadline: sevenDaysFromNow, estimatedHours: 1, status: 'pending',
    }));

    course.topics = replaceTopics
      ? importedTopics
      : [...course.topics, ...importedTopics];

    const updated = await course.save();
    console.log(`[importPlaylist] Saved. Total topics: ${updated.topics.length}`);

    res.json({
      message:       `Imported ${importedTopics.length} videos into "${course.courseName}"`,
      importedCount: importedTopics.length,
      course:        updated,
    });
  } catch (err) {
    console.error('importPlaylistToCourse error:', err);
    const msg = err.response?.data?.error?.error?.message
              || err.response?.data?.error?.message
              || err.response?.data?.message
              || 'Server Error during playlist import.';
    res.status(err.response?.status || 500).json({ message: msg });
  }
};

// Legacy — creates a brand-new course from a playlist (kept for backward compat)
exports.importPlaylist = async (req, res) => {
  try {
    const { playlistUrl, courseName, description } = req.body;
    if (!playlistUrl) return res.status(400).json({ message: 'playlistUrl is required' });
    const videos = await fetchPlaylistVideos(playlistUrl);
    if (!Array.isArray(videos)) {
      return res.status(502).json({ message: 'Failed to fetch videos' });
    }
    const topics = videos.map(v => ({
      title: v.title, youtubeUrl: v.videoUrl, article: '',
      deadline: new Date(), estimatedHours: 1,
    }));
    const saved = await new Course({
      userId: req.user.id,
      courseName: courseName || 'YouTube Playlist',
      description: description || '',
      status: 'approved', topics,
      isActive: false,
    }).save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('importPlaylist error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
