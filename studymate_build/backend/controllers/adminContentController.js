const Course = require('../models/Course');
const axios  = require('axios');

// ─────────────────────────────────────────────────────────────────────────────
// Helper — calls the YouTube playlist microservice on port 5001
// ─────────────────────────────────────────────────────────────────────────────
async function fetchPlaylistVideos(playlistUrl) {
  const resp = await axios.post('http://localhost:5001/get-playlist', { playlistUrl });
  return resp.data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/courses  — returns ALL courses
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllCourses = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    const courses = await Course.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ courses });
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/courses  — create course manually (no playlist)
// ─────────────────────────────────────────────────────────────────────────────
exports.createCourse = async (req, res) => {
  try {
    const { courseName, description, topics } = req.body;
    if (!courseName) {
      return res.status(400).json({ message: 'Course name is required' });
    }
    const newCourse = new Course({
      userId:      req.user.id,
      courseName,
      description: description || '',
      topics:      Array.isArray(topics) ? topics : []
    });
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error creating course' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/courses/:id  — update course
// ─────────────────────────────────────────────────────────────────────────────
exports.updateCourse = async (req, res) => {
  try {
    const updates = {};
    const { courseName, description, status, topics } = req.body;
    if (courseName   !== undefined) updates.courseName   = courseName;
    if (description  !== undefined) updates.description  = description;
    if (status       !== undefined) updates.status       = status;
    if (topics       !== undefined) updates.topics       = topics;

    const course = await Course.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error updating course' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/courses/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error deleting course' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/courses/import-playlist
//
// Creates a Course document directly from a YouTube playlist.
// Each video in the playlist becomes a topic embedded in the Course.
//
// Input:  { playlistUrl, courseName?, difficulty? }
// ─────────────────────────────────────────────────────────────────────────────
exports.importPlaylist = async (req, res) => {
  try {
    const { playlistUrl, courseName, difficulty } = req.body;

    if (!playlistUrl) {
      return res.status(400).json({ message: 'playlistUrl is required' });
    }

    // ── Step 1: Extract playlist ID ──────────────────────────────────────────
    const match = playlistUrl.match(/[?&]list=([^#&?]+)/);
    if (!match) {
      return res.status(400).json({ message: 'Invalid playlist URL. Must contain list=PLxxxxxx' });
    }
    const playlistId = match[1];

    // ── Step 2: Duplicate check ───────────────────────────────────────────────
    const existing = await Course.findOne({ youtubePlaylistId: playlistId });
    if (existing) {
      return res.status(409).json({
        message: `This playlist has already been imported as "${existing.courseName}".`,
        course: existing
      });
    }

    // ── Step 3: Fetch videos from playlist microservice ──────────────────────
    console.log(`[importPlaylist] Fetching playlist: ${playlistId}`);
    const videos = await fetchPlaylistVideos(playlistUrl);

    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(502).json({
        message: 'No videos found. Make sure the playlist is public and not empty.'
      });
    }

    // ── Step 4: Build thumbnail & default course name ────────────────────────
    const firstVideoUrl = videos[0]?.videoUrl || '';
    const vidIdMatch    = firstVideoUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    const thumbnail     = vidIdMatch
      ? `https://img.youtube.com/vi/${vidIdMatch[1]}/mqdefault.jpg`
      : '';

    const resolvedName = (courseName || '').trim()
      || `YouTube Playlist (${videos.length} videos)`;

    // ── Step 5: Build topics (one per video) ─────────────────────────────────
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const topics = videos.map((v) => ({
      title:          v.title,
      youtubeUrl:     v.videoUrl || '',
      article:        '',
      deadline:       sevenDaysFromNow,
      estimatedHours: 1,
      status:         'pending',
    }));

    // ── Step 6: Create Course ────────────────────────────────────────────────
    const course = await new Course({
      userId:            req.user.id,
      courseName:        resolvedName,
      youtubePlaylistId: playlistId,
      thumbnail,
      description:       `Imported from YouTube playlist. Difficulty: ${difficulty || 'medium'}.`,
      status:            'approved',
      topics,
    }).save();

    console.log(`[importPlaylist] Created Course: ${course._id} — ${resolvedName} (${topics.length} topics)`);

    res.status(201).json({
      message:     `Successfully imported "${resolvedName}" with ${topics.length} videos.`,
      course,
      totalVideos: videos.length,
      chapters:    topics,   // kept for UI backward-compat (shows count)
    });

  } catch (error) {
    console.error('importPlaylist error:', error);
    const ytMsg = error.response?.data?.error?.message
               || error.response?.data?.error?.error?.message;
    if (ytMsg) {
      return res.status(502).json({ message: `YouTube API error: ${ytMsg}` });
    }
    res.status(500).json({ message: 'Server error during playlist import.' });
  }
};
