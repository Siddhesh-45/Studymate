const nodemailer = require('nodemailer');

// ─── Transporter ──────────────────────────────────────────────────────────────
// Uses Gmail SMTP. Set EMAIL_USER and EMAIL_PASS in .env
// For Gmail: use an App Password (not your real password)
//   → Google Account → Security → 2FA enabled → App Passwords → create one
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4, // Force IPv4 (fixes IPv6 ENETUNREACH errors on Render)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email Transporter Configuration Error:', error);
  } else {
    console.log('Email Server is ready to send messages.');
  }
});

// ─── Send reminder email ──────────────────────────────────────────────────────
const sendReminderEmail = async (to, name, taskTitle, deadline, taskId) => {
  const formattedDate = new Date(deadline).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const taskLink = `${appUrl}/schedule`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>
      body { margin:0; padding:0; background:#0f172a; font-family:'Segoe UI',Arial,sans-serif; }
      .wrap { max-width:560px; margin:32px auto; border-radius:16px; overflow:hidden;
              background:#1e293b; border:1px solid rgba(255,255,255,0.08); }
      .header { padding:28px 32px; background:linear-gradient(135deg,#6366f1,#a855f7); text-align:center; }
      .header h1 { margin:0; color:#fff; font-size:22px; font-weight:800; letter-spacing:-0.5px; }
      .header p  { margin:6px 0 0; color:rgba(255,255,255,0.8); font-size:13px; }
      .body { padding:28px 32px; }
      .body p { color:#94a3b8; font-size:14px; line-height:1.7; margin:0 0 16px; }
      .body b { color:#e2e8f0; }
      .task-card {
        background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.25);
        border-radius:12px; padding:16px 20px; margin:20px 0;
      }
      .task-card .title { color:#a5b4fc; font-size:15px; font-weight:700; margin:0 0 6px; }
      .task-card .due   { color:#64748b; font-size:12px; }
      .btn {
        display:inline-block; padding:13px 28px; border-radius:10px;
        background:linear-gradient(90deg,#6366f1,#a855f7); color:#fff;
        text-decoration:none; font-size:14px; font-weight:700;
        text-align:center; margin:8px 0 0;
      }
      .footer { padding:18px 32px; text-align:center; border-top:1px solid rgba(255,255,255,0.06); }
      .footer p { color:#334155; font-size:11px; margin:0; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <h1>📚 StudyMate Reminder</h1>
        <p>You have a pending task waiting for you</p>
      </div>
      <div class="body">
        <p>Hey <b>${name}</b> 👋</p>
        <p>
          You still have a scheduled task that hasn't been completed yet.
          Don't let it slip! Small, consistent steps lead to big results. 🚀
        </p>
        <div class="task-card">
          <div class="title">📌 ${taskTitle}</div>
          <div class="due">⏰ Was scheduled for: ${formattedDate}</div>
        </div>
        <p>Tap the button below to open your schedule and mark it done.</p>
        <a href="${taskLink}" class="btn">▶ Start Task Now</a>
      </div>
      <div class="footer">
        <p>You're receiving this because you have an active StudyMate account.</p>
        <p style="margin-top:4px">Reminders are sent every 2 hours for missed tasks between 7 AM – 10 PM.</p>
      </div>
    </div>
  </body>
  </html>`;

  try {
    await transporter.sendMail({
      from: `"StudyMate 📚" <${process.env.EMAIL_USER}>`,
      to,
      subject: `⏰ Reminder: "${taskTitle}" is still pending`,
      html,
    });
    console.log(`Reminder email sent successfully to ${to}`);
  } catch (err) {
    console.error(`Failed to send reminder email to ${to}:`, err);
  }
};

module.exports = { sendReminderEmail };
