/**
 * run-progress-tests.js
 * Mints a JWT directly from the DB user + JWT_SECRET, then tests all Progress APIs.
 * Run: node run-progress-tests.js
 */
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const BASE_HOST = 'localhost';
const BASE_PORT = 5000;

// ── Real data from find-test-user.js output ───────────────────────────────
const TEST_EMAIL  = 'sonawanesiddhesh45@gmail.com';
const TEST_COURSE = '69cba284f64188261f96fad0';  // java
const TEST_TOPIC  = 'Introduction to Java + Installing Java JDK and IntelliJ IDEA for Java';
// ──────────────────────────────────────────────────────────────────────────

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: BASE_HOST,
      port: BASE_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const ok   = (msg, detail) => console.log(`  ✅ ${msg}`, detail !== undefined ? JSON.stringify(detail, null, 2) : '');
const fail = (msg, detail) => console.log(`  ❌ ${msg}`, detail !== undefined ? JSON.stringify(detail) : '');
const hdr  = (msg) => console.log(`\n▶ ${msg}`);

(async () => {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('   StudyMate — Progress & Analytics API Test Suite');
  console.log('══════════════════════════════════════════════════════');

  await mongoose.connect(process.env.MONGO_URI);

  // ── Mint a JWT for the test user ────────────────────────────────────────
  hdr('Minting JWT for test user…');
  const user = await User.findOne({ email: TEST_EMAIL }).lean();
  if (!user) { console.log('  ❌ User not found:', TEST_EMAIL); process.exit(1); }

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  ok(`Token minted for ${user.email} (id: ${user._id})`);

  await mongoose.disconnect();  // server handles its own connection

  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. GET /api/progress/stats (baseline) ──────────────────────────────
  hdr('1/5 — GET /api/progress/stats  (baseline)');
  const s1 = await request('GET', '/api/progress/stats', null, token);
  if (s1.status === 200) {
    ok('Status 200', {
      totalCompleted : s1.body.totalCompleted,
      streak         : s1.body.streak,
      enrolledCourses: s1.body.courseProgress?.length,
      avgProgress    : s1.body.dashboard?.avgProgress
    });
  } else {
    fail('GET /stats', s1.body);
  }

  // ── 2. POST /api/progress/complete (first time) ─────────────────────────
  hdr('2/5 — POST /api/progress/complete  (first attempt)');
  const c1 = await request('POST', '/api/progress/complete',
    { courseId: TEST_COURSE, topic: TEST_TOPIC }, token);
  if (c1.status === 200) {
    ok(`Status 200 — alreadyDone: ${c1.body.alreadyDone}`, c1.body);
  } else {
    fail('POST /complete', c1.body);
  }

  // ── 3. POST /api/progress/complete (duplicate) ──────────────────────────
  hdr('3/5 — POST /api/progress/complete  (duplicate / dedup check)');
  const c2 = await request('POST', '/api/progress/complete',
    { courseId: TEST_COURSE, topic: TEST_TOPIC }, token);
  if (c2.status === 200 && c2.body.alreadyDone === true) {
    ok('Dedup guard worked — alreadyDone: true', c2.body);
  } else {
    fail('Dedup check — expected alreadyDone:true', c2.body);
  }

  // ── 4. GET /api/progress/course/:courseId ──────────────────────────────
  hdr('4/5 — GET /api/progress/course/:courseId');
  const cp = await request('GET', `/api/progress/course/${TEST_COURSE}`, null, token);
  if (cp.status === 200) {
    ok('Status 200', {
      courseName      : cp.body.courseName,
      totalTopics     : cp.body.totalTopics,
      completedTopics : cp.body.completedTopics,
      percentage      : `${cp.body.percentage}%`
    });
    // Show first 3 topics
    const preview = cp.body.topics?.slice(0, 3).map(t => ({ title: t.title.slice(0, 40), status: t.status }));
    console.log('  📋 Topic preview:', JSON.stringify(preview, null, 2));
  } else {
    fail('GET /course/:id', cp.body);
  }

  // ── 5. GET /api/progress/stats (updated) ──────────────────────────────
  hdr('5/5 — GET /api/progress/stats  (after marking topic)');
  const s2 = await request('GET', '/api/progress/stats', null, token);
  if (s2.status === 200) {
    ok('Status 200 — full analytics', {
      totalCompleted  : s2.body.totalCompleted,
      streak          : s2.body.streak,
      avgProgress     : s2.body.dashboard?.avgProgress,
      completedCourses: s2.body.dashboard?.completedCourses,
      totalCourses    : s2.body.dashboard?.totalCourses,
      last7Days       : s2.body.dashboard?.last7Days
    });
    console.log('\n  📊 courseProgress breakdown:');
    (s2.body.courseProgress || []).forEach(c => {
      console.log(`     • ${c.courseName}: ${c.completedTopics}/${c.totalTopics} = ${c.percentage}%`);
    });
    console.log('\n  📅 dailyStats:', JSON.stringify(s2.body.dailyStats, null, 2));
  } else {
    fail('GET /stats (post)', s2.body);
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('   All tests complete');
  console.log('══════════════════════════════════════════════════════\n');
  process.exit(0);
})();
