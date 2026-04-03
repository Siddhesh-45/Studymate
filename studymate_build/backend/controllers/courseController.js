const Course         = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');

const buildProgressSnapshot = (course, completedVideoIds = []) => {
  const topics = Array.isArray(course?.topics) ? course.topics : [];
  const validTopicIds = new Set(topics.map((topic) => String(topic._id)));

  const completedVideos = [...new Set(
    completedVideoIds
      .map((id) => String(id))
      .filter((id) => validTopicIds.has(id))
  )];

  const totalLessons = topics.length;
  const completedLessons = completedVideos.length;
  const completionPercentage =
    totalLessons > 0
      ? parseFloat(((completedLessons / totalLessons) * 100).toFixed(2))
      : 0;

  return {
    completedVideos,
    completedLessons,
    totalLessons,
    completionPercentage,
    progress: completionPercentage,
    isCompleted: totalLessons > 0 && completedLessons === totalLessons,
  };
};

const mergeCourseWithProgress = (course, progressRecord) => {
  const snapshot = buildProgressSnapshot(course, progressRecord?.completedVideos || []);
  const completedVideoSet = new Set(snapshot.completedVideos);

  return {
    ...course,
    topics: (course.topics || []).map((topic) => ({
      ...topic,
      status: completedVideoSet.has(String(topic._id)) ? 'completed' : 'pending',
    })),
    progress: snapshot,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/course  — available to ALL logged-in users
// Admin  → sees all courses
// Student → sees only approved courses
// ─────────────────────────────────────────────────────────────────────────────
exports.getCourses = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { status: 'approved' };
    const courses = await Course.find(query).lean();

    if (req.user.role === 'admin') {
      return res.json(courses);
    }

    const progressRecords = await CourseProgress.find({
      userId: req.user.id,
      courseId: { $in: courses.map((course) => course._id) }
    }).lean();

    const progressByCourseId = new Map(
      progressRecords.map((record) => [String(record.courseId), record])
    );

    const personalizedCourses = courses.map((course) =>
      mergeCourseWithProgress(course, progressByCourseId.get(String(course._id)))
    );

    res.json(personalizedCourses);
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
//   1. Toggles THIS student's completed video list in CourseProgress
//   2. Recalculates progress from completed videos / total course videos
//
// Important:
//   - progress is stored per user, not on the shared Course document
//   - analytics still stays in sync through CourseProgress
//
// CourseProgress fields updated:
//   completedVideos      → array of completed topic/video ids for this student
//   completedLessons     → count of completed videos
//   totalLessons         → course.topics.length
//   completionPercentage → (completedLessons / totalLessons) * 100
//   isCompleted          → true only when completionPercentage === 100
//   lastAccessedAt       → now
// ─────────────────────────────────────────────────────────────────────────────
exports.toggleTopicStatus = async (req, res) => {
  try {
    const userId   = req.user.id;
    const courseId = req.params.courseId || req.params.id;
    const topicId  = req.params.topicId;

    // ── Step 1: Find the course ──────────────────────────────────────────────
    const course = await Course.findOne({ _id: courseId, status: 'approved' }).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // ── Step 2: Find the specific video/topic inside the course ─────────────
    const topic = (course.topics || []).find((item) => String(item._id) === String(topicId));
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found.' });
    }

    // ── Step 3: Toggle THIS student's completion only ───────────────────────
    // Important: progress is per-user, so we do NOT mutate the shared Course document.
    const existingProgress = await CourseProgress.findOne({ userId, courseId }).lean();
    const completedVideoSet = new Set(
      (existingProgress?.completedVideos || []).map((id) => String(id))
    );

    let newStatus = 'completed';
    if (completedVideoSet.has(String(topic._id))) {
      completedVideoSet.delete(String(topic._id));
      newStatus = 'pending';
    } else {
      completedVideoSet.add(String(topic._id));
    }

    const progressSnapshot = buildProgressSnapshot(course, Array.from(completedVideoSet));

    // ── Step 4: Upsert CourseProgress record ─────────────────────────────────
    const progressRecord = await CourseProgress.findOneAndUpdate(
      { userId, courseId },
      {
        $set: {
          completedVideos: progressSnapshot.completedVideos,
          completedLessons: progressSnapshot.completedLessons,
          totalLessons: progressSnapshot.totalLessons,
          completionPercentage: progressSnapshot.completionPercentage,
          progress: progressSnapshot.progress,
          isCompleted: progressSnapshot.isCompleted,
          lastAccessedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      `[toggleTopic] User:${userId} Course:${courseId} Topic:${topicId}` +
      ` → ${newStatus} | Progress: ${progressSnapshot.completedLessons}/${progressSnapshot.totalLessons}` +
      ` (${progressSnapshot.completionPercentage}%)`
    );

    // ── Step 5: Return accurate progress for the frontend ────────────────────
    res.json({
      message: `Topic marked as ${newStatus}`,
      topicId: topic._id,
      status: newStatus,
      progress: {
        ...progressSnapshot,
        recordId: progressRecord._id,
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
// Helper — calls the playlist microservice on port 5001
// ─────────────────────────────────────────────────────────────────────────────
async function fetchPlaylistVideos(playlistUrl) {
  const axios = require('axios');
  const resp  = await axios.post('http://localhost:5001/get-playlist', { playlistUrl });
  return resp.data || [];
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
    }).save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('importPlaylist error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/course/enroll  — student only
// Body: { userId, courseId }
//
// Creates a fresh CourseProgress record for the student.
// Uses upsert so calling /enroll twice is safe — returns existing progress
// instead of throwing a duplicate-key error.
// ─────────────────────────────────────────────────────────────────────────────
exports.enroll = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required.' });
    }

    // Verify the course exists and is approved
    const course = await Course.findOne({ _id: courseId, status: 'approved' }).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found or not available.' });
    }

    const progressSnapshot = buildProgressSnapshot(course, []);

    // upsert — create a unique progress record per user-course pair
    const progress = await CourseProgress.findOneAndUpdate(
      { userId, courseId },
      {
        $setOnInsert: {
          completedVideos: progressSnapshot.completedVideos,
          completedLessons: progressSnapshot.completedLessons,
          totalLessons: progressSnapshot.totalLessons,
          completionPercentage: progressSnapshot.completionPercentage,
          progress: progressSnapshot.progress,
          isCompleted: progressSnapshot.isCompleted,
        },
        $set: {
          totalLessons: progressSnapshot.totalLessons,
          lastAccessedAt: new Date(),
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      message: 'Progress tracking ready for this course.',
      progress
    });
  } catch (err) {
    console.error('enroll error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
