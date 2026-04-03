const Course = require('../models/Course');
const axios = require('axios');

// Helper (shared with courseController) to fetch videos from playlist service
async function fetchPlaylistVideos(playlistUrl) {
  const resp = await axios.post('http://localhost:5001/get-playlist', { playlistUrl });
  return resp.data || [];
}

exports.getAllCourses = async (req, res) => {
  try {
    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    const courses = await Course.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ courses });
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { courseName, description, topics } = req.body;

    if (!courseName) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    const newCourse = new Course({
      userId: req.user.id,
      courseName,
      description: description || '',
      topics: Array.isArray(topics) ? topics : []
    });

    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error creating course' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const updates = {};
    const { courseName, description, status, topics } = req.body;

    if (courseName !== undefined) updates.courseName = courseName;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (topics !== undefined) updates.topics = topics;

    const course = await Course.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error updating course' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error deleting course' });
  }
};

exports.importPlaylist = async (req, res) => {
  try {
    const { playlistUrl, courseName, description } = req.body;
    if (!playlistUrl) {
      return res.status(400).json({ message: 'playlistUrl is required' });
    }

    const videos = await fetchPlaylistVideos(playlistUrl);
    if (!Array.isArray(videos)) {
      return res.status(502).json({ message: 'Failed to fetch videos from playlist service' });
    }

    const topics = videos.map((v) => ({
      title: v.title,
      youtubeUrl: v.videoUrl,
      article: '',
      deadline: new Date(),
      estimatedHours: 1
    }));

    const newCourse = new Course({
      userId: req.user.id,
      courseName: courseName || 'YouTube Playlist',
      description: description || '',
      topics
    });

    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    console.error('Error importing playlist (admin):', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
