const Course = require('../models/Course');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: safely extract and parse a JSON array from the AI response text
// ─────────────────────────────────────────────────────────────────────────────
function parseQuizJSON(rawText) {
  if (!rawText) throw new Error('Empty response from AI');

  // Strip markdown code fences if present
  let cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Find the first '[' and last ']' to isolate the array
  const start = cleaned.indexOf('[');
  const end   = cleaned.lastIndexOf(']');

  if (start === -1 || end === -1) {
    throw new Error('No JSON array found in Gemini response.');
  }

  const jsonStr = cleaned.slice(start, end + 1);
  return JSON.parse(jsonStr); // throws SyntaxError if still invalid
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quiz/generate/:courseId/:lessonId
// Generates exactly 15 MCQs via Gemini AI
// ─────────────────────────────────────────────────────────────────────────────
exports.generateQuiz = async (req, res) => {
  try {
    // ── 1. Validate env ────────────────────────────────────────────────────
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error('[quiz] GEMINI_API_KEY is not set in .env');
      return res.status(500).json({ message: 'Gemini API key is not configured on the server.' });
    }

    // Initialize official Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ── 2. Fetch lesson data ───────────────────────────────────────────────
    const { courseId, lessonId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const lesson = course.topics.find((t) => String(t._id) === lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found in this course.' });
    }

    const lessonTitle       = lesson.title       || 'Programming Concepts';
    const lessonDescription = lesson.description || '';
    const codeSnippet       = lesson.codeSnippet || '';

    // ── 3. Build prompt (15 questions) ──────────────────────────────────────
    const prompt = `Generate exactly 15 multiple choice questions about the following topic.
Topic Title: ${lessonTitle}
${lessonDescription ? `Description: ${lessonDescription}` : ''}
${codeSnippet ? `Code Example:\n${codeSnippet}` : ''}

STRICT REQUIREMENTS:
- Output ONLY a raw JSON array. Nothing else. No explanation. No markdown. No code fences.
- Exactly 15 questions
- Each question has exactly 4 options
- correctAnswer must be the EXACT TEXT of one of the options
- Questions should range from easy to hard, covering different aspects of the topic

Output format (copy this structure exactly):
[{"question":"...","options":["option1","option2","option3","option4"],"correctAnswer":"option1"}]`;

    // ── 4. Call Gemini API via official SDK ────────────────────────────────
    let rawContent;
    try {
      const result = await model.generateContent(prompt);
      rawContent = result.response.text();
    } catch (apiErr) {
      console.error("[quiz] Gemini API SDK error:", apiErr.message);
      return res.status(502).json({ message: `Gemini API connection error: ${apiErr.message}` });
    }

    console.log('[quiz] Raw Gemini content length:', rawContent?.length);

    // ── 5. Parse JSON safely ────────────────────────────────────────────────
    let questions;
    try {
      questions = parseQuizJSON(rawContent);
    } catch (parseErr) {
      console.error('[quiz] JSON parse error:', parseErr.message);
      console.error('[quiz] Raw content was:', rawContent);
      return res.status(502).json({
        message: 'Failed to parse quiz JSON from Gemini response.',
        raw: rawContent,
      });
    }

    // ── 6. Validate structure ───────────────────────────────────────────────
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(502).json({ message: 'Gemini returned an invalid quiz structure.' });
    }

    // Limit to exactly 15 questions (or return available if fewer)
    questions = questions.slice(0, 15);

    // Validate each question has the correct structure
    questions = questions.filter(q =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.correctAnswer &&
      q.options.includes(q.correctAnswer)
    );

    if (questions.length === 0) {
      return res.status(502).json({ message: 'No valid questions generated. Please retry.' });
    }

    console.log(`[quiz] Returning ${questions.length} valid questions (target: 15)`);

    // ── 7. Return quiz ──────────────────────────────────────────────────────
    return res.status(200).json({
      lessonId,
      courseId,
      lessonTitle,
      totalQuestions: questions.length,
      questions,
    });

  } catch (err) {
    console.error('[quiz] generateQuiz fatal error:', err.message);
    return res.status(500).json({ message: 'Server error generating quiz.' });
  }
};
