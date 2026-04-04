require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const StudentCourse = require('./models/StudentCourse');
const Course = require('./models/Course');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Find non-admin users
  const users = await User.find({ role: { $ne: 'admin' } })
    .select('email role name')
    .limit(5)
    .lean();

  console.log('\n── Student accounts ──────────────────────');
  users.forEach(u => console.log(`  email: ${u.email}  role: ${u.role}`));

  // Find student-course enrollments
  const enrolments = await StudentCourse.find({})
    .populate('studentId', 'email')
    .populate('courseId', 'courseName topics')
    .limit(5)
    .lean();

  console.log('\n── Enrolments ────────────────────────────');
  enrolments.forEach(e => {
    const firstTopic = e.courseId?.topics?.[0]?.title || '(no topics)';
    console.log(`  student: ${e.studentId?.email}  course: ${e.courseId?.courseName}  courseId: ${e.courseId?._id}  firstTopic: "${firstTopic}"`);
  });

  if (enrolments.length === 0) {
    console.log('\n  ⚠️  No enrolments found. Enroll a student in a course first.');
  }

  console.log('\n  ℹ️  Copy the email, courseId, and firstTopic above into test-progress-api.js');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
