/**
 * seedMasterCourses.js
 * Run once to populate the master_courses collection.
 * Usage: node seedMasterCourses.js
 */
require('dotenv').config();
const mongoose    = require('mongoose');
const MasterCourse = require('./models/MasterCourse');

const MASTER_COURSES = [
  { name: 'DSA',                    difficulty: 'hard',   subject: 'Computer Science' },
  { name: 'DBMS',                   difficulty: 'medium', subject: 'Computer Science' },
  { name: 'Operating Systems',      difficulty: 'hard',   subject: 'Computer Science' },
  { name: 'Computer Networks',      difficulty: 'medium', subject: 'Computer Science' },
  { name: 'Software Engineering',   difficulty: 'easy',   subject: 'Computer Science' },
  { name: 'Object Oriented Programming', difficulty: 'medium', subject: 'Programming' },
  { name: 'Machine Learning',       difficulty: 'hard',   subject: 'AI/ML'           },
  { name: 'Web Development',        difficulty: 'easy',   subject: 'Web'             },
  { name: 'Computer Architecture',  difficulty: 'hard',   subject: 'Computer Science' },
  { name: 'Discrete Mathematics',   difficulty: 'medium', subject: 'Mathematics'     },
  { name: 'Linear Algebra',         difficulty: 'medium', subject: 'Mathematics'     },
  { name: 'Probability & Statistics', difficulty: 'medium', subject: 'Mathematics'  },
  { name: 'Compiler Design',        difficulty: 'hard',   subject: 'Computer Science' },
  { name: 'Theory of Computation',  difficulty: 'hard',   subject: 'Computer Science' },
  { name: 'Artificial Intelligence', difficulty: 'hard',  subject: 'AI/ML'           },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Upsert each course (safe to re-run)
    for (const course of MASTER_COURSES) {
      await MasterCourse.findOneAndUpdate(
        { name: course.name },
        course,
        { upsert: true, new: true }
      );
    }

    console.log(`✅ Seeded ${MASTER_COURSES.length} master courses.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
