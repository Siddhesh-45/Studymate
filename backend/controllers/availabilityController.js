const UserAvailability = require('../models/UserAvailability');

// ─────────────────────────────────────────────────────────────────────────────
// Mapping: named day fields ↔ weeklyHours array index
//   weeklyHours index: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// ─────────────────────────────────────────────────────────────────────────────
const DAY_MAP = {
  sunday:    0,
  monday:    1,
  tuesday:   2,
  wednesday: 3,
  thursday:  4,
  friday:    5,
  saturday:  6,
};

const DAY_NAMES = Object.keys(DAY_MAP); // ['sunday','monday', ...]

/**
 * Convert weeklyHours array → named-day object
 * [2, 3, 1, 0, 2, 4, 5] → { sunday:2, monday:3, tuesday:1, ... }
 */
function arrayToNamedDays(arr) {
  const obj = {};
  DAY_NAMES.forEach((day) => {
    obj[day] = arr[DAY_MAP[day]] ?? 0;
  });
  return obj;
}

/**
 * Convert named-day object → weeklyHours array
 * { monday:2, tuesday:1, ... } → [sun, mon, tue, wed, thu, fri, sat]
 */
function namedDaysToArray(body) {
  const arr = [0, 0, 0, 0, 0, 0, 0];
  DAY_NAMES.forEach((day) => {
    if (typeof body[day] === 'number') {
      arr[DAY_MAP[day]] = body[day];
    }
  });
  return arr;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/availability
// Save or update the student's weekly study hours
//
// Body:
// {
//   "monday":    2,
//   "tuesday":   1,
//   "wednesday": 3,
//   "thursday":  2,
//   "friday":    1,
//   "saturday":  4,
//   "sunday":    4
// }
//
// Rules:
//   - One availability per user (upsert)
//   - Each day must be a number between 0 and 12
// ─────────────────────────────────────────────────────────────────────────────
exports.saveAvailability = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate: at least one day must be provided
    const providedDays = DAY_NAMES.filter((day) => req.body[day] !== undefined);
    if (providedDays.length === 0) {
      return res.status(400).json({
        message: 'Please provide study hours for at least one day (monday, tuesday, ... sunday).',
      });
    }

    // Validate: each provided value must be a number 0–12
    for (const day of providedDays) {
      const val = req.body[day];
      if (typeof val !== 'number' || val < 0 || val > 12) {
        return res.status(400).json({
          message: `"${day}" must be a number between 0 and 12. Got: ${val}`,
        });
      }
    }

    // If updating existing, merge with current values so partial updates work
    let existing = await UserAvailability.findOne({ userId });
    let currentArray = existing ? existing.weeklyHours : [2, 2, 2, 2, 2, 4, 4];

    // Convert incoming named days to array, merging with existing
    DAY_NAMES.forEach((day) => {
      if (typeof req.body[day] === 'number') {
        currentArray[DAY_MAP[day]] = req.body[day];
      }
    });

    // Upsert
    const avail = await UserAvailability.findOneAndUpdate(
      { userId },
      { weeklyHours: currentArray },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Return in named-day format
    const namedDays = arrayToNamedDays(avail.weeklyHours);

    res.json({
      message: 'Availability saved successfully',
      availability: {
        _id:    avail._id,
        userId: avail.userId,
        ...namedDays,
        updatedAt: avail.updatedAt,
      },
    });
  } catch (err) {
    console.error('saveAvailability error:', err);
    res.status(500).json({ message: 'Server error saving availability.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/availability
// Returns the student's saved weekly availability in named-day format
//
// Response:
// {
//   userId: "...",
//   monday: 2,
//   tuesday: 1,
//   wednesday: 3,
//   thursday: 2,
//   friday: 1,
//   saturday: 4,
//   sunday: 4
// }
// ─────────────────────────────────────────────────────────────────────────────
exports.getAvailability = async (req, res) => {
  try {
    const userId = req.user.id;

    let avail = await UserAvailability.findOne({ userId });

    // Return defaults if none saved yet
    const weeklyHours = avail ? avail.weeklyHours : [2, 2, 2, 2, 2, 4, 4];
    const namedDays = arrayToNamedDays(weeklyHours);

    res.json({
      userId,
      ...namedDays,
      ...(avail ? { _id: avail._id, updatedAt: avail.updatedAt } : { _id: null }),
    });
  } catch (err) {
    console.error('getAvailability error:', err);
    res.status(500).json({ message: 'Server error fetching availability.' });
  }
};
