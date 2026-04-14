const DynamicSchedule = require('../models/DynamicSchedule');
const User             = require('../models/User');
const { sendReminderEmail } = require('../utils/mailer');

// ─── Constants ────────────────────────────────────────────────────────────────
const REMINDER_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CRON_INTERVAL_MS     = 10 * 60 * 1000;      // run every 10 minutes
const ALLOWED_HOUR_START   = 7;                    // 7 AM
const ALLOWED_HOUR_END     = 22;                   // 10 PM

// ─── Helper: is current time within allowed window? ──────────────────────────
function isAllowedTime() {
  const hour = new Date().getHours(); // local server time
  return hour >= ALLOWED_HOUR_START && hour < ALLOWED_HOUR_END;
}

// ─── Helper: is reminder due? (2-hour gap enforced) ──────────────────────────
function isReminderDue(lastReminderSent) {
  if (!lastReminderSent) return true; // never sent → send now
  return Date.now() - new Date(lastReminderSent).getTime() >= REMINDER_INTERVAL_MS;
}

// ─── Core job ─────────────────────────────────────────────────────────────────
async function runReminderJob() {
  // Skip silently if outside allowed window
  if (!isAllowedTime()) return;

  const now      = new Date();
  const todayStr = now.toISOString().split('T')[0]; // e.g. "2026-04-14"

  try {
    // Load ALL schedules with user populated (handles every registered user)
    const schedules = await DynamicSchedule.find({}).populate({
      path: 'userId',
      select: 'name email status',
      model: User,
    });

    let sent = 0;

    for (const schedule of schedules) {
      const user = schedule.userId;

      // Skip deleted / blocked users
      if (!user || !user.email || user.status === 'blocked') continue;

      // ── Find TODAY's day entry for this user ──────────────────────────────
      const todayDay = schedule.days.find(d => {
        const dayStr = new Date(d.date).toISOString().split('T')[0];
        return dayStr === todayStr;
      });

      if (!todayDay || !todayDay.tasks?.length) continue; // no tasks today

      let scheduleModified = false;

      for (const task of todayDay.tasks) {
        // ── Condition 1: only pending tasks ──────────────────────────────────
        if (task.status === 'completed' || task.status === 'missed') continue;

        // ── Condition 2: 2-hour gap between reminders ─────────────────────
        if (!isReminderDue(task.lastReminderSent)) continue;

        // ── All conditions passed → send email ────────────────────────────
        try {
          await sendReminderEmail(
            user.email,
            user.name,
            task.title || task.courseName || 'Study Task',
            todayDay.date,
            task._id,
          );

          task.lastReminderSent = now;
          scheduleModified = true;
          sent++;

          console.log(`[Reminder] ✉️  ${user.email} → "${task.title || task.courseName}" (today)`);
        } catch (emailErr) {
          console.error(`[Reminder] ❌ Failed for ${user.email}:`, emailErr.message);
        }
      }

      // Save only if we modified something (avoids unnecessary DB writes)
      if (scheduleModified) {
        await schedule.save();
      }
    }

    if (sent > 0) {
      console.log(`[Reminder] ✅ ${sent} reminder(s) sent at ${now.toLocaleTimeString()}`);
    } else {
      console.log(`[Reminder] 🔕 No reminders due at ${now.toLocaleTimeString()}`);
    }
  } catch (err) {
    console.error('[Reminder] Job error:', err.message);
  }
}

// ─── Start cron ───────────────────────────────────────────────────────────────
function startReminderCron() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Reminder] EMAIL_USER or EMAIL_PASS not set — reminder emails disabled.');
    return;
  }

  console.log('[Reminder] Cron started — checks every 10 minutes (7 AM – 10 PM only)');
  setInterval(runReminderJob, CRON_INTERVAL_MS);

  // Run once 30s after startup (gives Mongo time to connect first)
  setTimeout(runReminderJob, 30 * 1000);
}

module.exports = { startReminderCron };
