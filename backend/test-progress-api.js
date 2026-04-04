/**
 * test-progress-api.js
 * Run: node test-progress-api.js
 *
 * Tests the three /api/progress endpoints.
 * Requires: server running on port 5000, a valid student account in MongoDB.
 *
 * Steps executed:
 *  1. Login to get a JWT
 *  2. POST /api/progress/complete  — mark a topic done
 *  3. POST /api/progress/complete  — same topic again (dedup check)
 *  4. GET  /api/progress/stats     — fetch dashboard analytics
 *  5. GET  /api/progress/course/:courseId — per-course breakdown
 */

const http = require('http');

const BASE = 'http://localhost:5000';

// ── Config — edit these to match a real user/course in your DB ─────────────
const EMAIL    = 'student@example.com';   // ← your test student email
const PASSWORD = 'password123';           // ← your test student password
const COURSE_ID = null;                   // ← will be auto-filled after login/stats
const TOPIC     = 'Introduction';         // ← a topic title that exists in the course
// ──────────────────────────────────────────────────────────────────────────────

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };

    const req = http.request(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
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

function pass(label, detail = '') {
  console.log(`  ✅ PASS — ${label}${detail ? ': ' + JSON.stringify(detail, null, 2) : ''}`);
}
function fail(label, detail = '') {
  console.log(`  ❌ FAIL — ${label}${detail ? ': ' + JSON.stringify(detail) : ''}`);
}

(async () => {
  console.log('\n══════════════════════════════════════════');
  console.log('  Progress API Test Suite');
  console.log('══════════════════════════════════════════\n');

  // ── STEP 1: Login ──────────────────────────────────────────────────────────
  console.log('▶ STEP 1 — Login');
  const loginRes = await request('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD });
  if (loginRes.status !== 200 || !loginRes.body.token) {
    fail('Login', loginRes.body);
    process.exit(1);
  }
  const token = loginRes.body.token;
  pass('Login', { status: loginRes.status });

  // ── STEP 2: GET stats first to find a real courseId ────────────────────────
  console.log('\n▶ STEP 2 — GET /api/progress/stats (pre-state)');
  const statsRes1 = await request('GET', '/api/progress/stats', null, token);
  if (statsRes1.status !== 200) {
    fail('GET /stats', statsRes1.body);
  } else {
    pass('GET /stats', {
      totalCompleted: statsRes1.body.totalCompleted,
      streak: statsRes1.body.streak,
      courses: statsRes1.body.courseProgress?.length,
      last7Days: statsRes1.body.dashboard?.last7Days
    });
  }

  // Pick a courseId from enrolled courses (or use env override)
  let courseId = COURSE_ID ||
    statsRes1.body.courseProgress?.[0]?.courseId ||
    null;

  // ── STEP 3: Mark topic complete ────────────────────────────────────────────
  if (courseId) {
    console.log('\n▶ STEP 3 — POST /api/progress/complete');
    const completeRes = await request('POST', '/api/progress/complete',
      { courseId, topic: TOPIC }, token);

    if (completeRes.status === 200) {
      pass('POST /complete (first attempt)', completeRes.body);
    } else {
      fail('POST /complete (first attempt)', completeRes.body);
    }

    // ── STEP 4: Duplicate detection ──────────────────────────────────────────
    console.log('\n▶ STEP 4 — POST /api/progress/complete (dedup check)');
    const dupRes = await request('POST', '/api/progress/complete',
      { courseId, topic: TOPIC }, token);

    if (dupRes.status === 200 && dupRes.body.alreadyDone === true) {
      pass('Dedup — already marked, skipped cleanly', dupRes.body);
    } else {
      fail('Dedup check', dupRes.body);
    }

    // ── STEP 5: Per-course breakdown ─────────────────────────────────────────
    console.log('\n▶ STEP 5 — GET /api/progress/course/:courseId');
    const courseRes = await request('GET', `/api/progress/course/${courseId}`, null, token);
    if (courseRes.status === 200) {
      pass('GET /course/:courseId', {
        courseName: courseRes.body.courseName,
        totalTopics: courseRes.body.totalTopics,
        completedTopics: courseRes.body.completedTopics,
        percentage: courseRes.body.percentage
      });
    } else {
      fail('GET /course/:courseId', courseRes.body);
    }

  } else {
    console.log('\n  ⚠️  No enrolled courses found — skipping Steps 3-5.');
    console.log('  Enroll a student in a course first, then re-run.\n');
  }

  // ── STEP 6: GET stats again (post-state) ──────────────────────────────────
  console.log('\n▶ STEP 6 — GET /api/progress/stats (post state)');
  const statsRes2 = await request('GET', '/api/progress/stats', null, token);
  if (statsRes2.status === 200) {
    const d = statsRes2.body;
    pass('GET /stats (post)', {
      totalCompleted: d.totalCompleted,
      streak: d.streak,
      avgProgress: d.dashboard?.avgProgress,
      completedCourses: d.dashboard?.completedCourses
    });
    console.log('\n  📊 Full response:');
    console.log(JSON.stringify(d, null, 2));
  } else {
    fail('GET /stats (post)', statsRes2.body);
  }

  console.log('\n══════════════════════════════════════════');
  console.log('  Test run complete');
  console.log('══════════════════════════════════════════\n');
  process.exit(0);
})();
