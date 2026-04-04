const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quote = require('../models/Quote');

// GET /api/quotes/random
router.get('/random', async (req, res) => {
  try {
    const { lastId, excludeIds } = req.query;
    
    let excludeArray = [];
    if (excludeIds) {
      excludeArray = excludeIds.split(',');
    } else if (lastId && lastId !== 'null' && lastId !== 'undefined') {
      excludeArray = [lastId];
    }

    const hour = new Date().getHours();
    let targetCategory = 'Motivation';

    // Smart Timing Logic:
    // Morning (5am–12pm): Motivational
    // Afternoon (12pm–5pm): Discipline
    // Evening (5pm–10pm): Funny / Light
    // Night (10pm–2am): Savage / Reality check
    // Night (2am-5am): Savage / Reality check
    if (hour >= 5 && hour < 12) {
      targetCategory = 'Motivation';
    } else if (hour >= 12 && hour < 17) {
      targetCategory = 'Discipline';
    } else if (hour >= 17 && hour < 22) {
      targetCategory = 'Funny';
    } else {
      targetCategory = 'Savage';
    }

    // Build match query
    let matchQuery = { category: targetCategory };
    if (excludeArray.length > 0) {
      const validIds = excludeArray
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      if (validIds.length > 0) {
        matchQuery._id = { $nin: validIds };
      }
    }

    // Aggregate to pick one random quote matching the category
    let quotes = await Quote.aggregate([
      { $match: matchQuery },
      { $sample: { size: 1 } }
    ]);

    // If no quote found (e.g., all were filtered out by $ne or no quotes in DB at all)
    // Fallback to any quote ignoring lastId, or any category
    if (quotes.length === 0) {
      quotes = await Quote.aggregate([
        { $match: { category: targetCategory } },
        { $sample: { size: 1 } }
      ]);
    }

    // Still no quote? Fetch literally any random quote
    if (quotes.length === 0) {
      quotes = await Quote.aggregate([
        { $sample: { size: 1 } }
      ]);
    }

    if (quotes.length === 0) {
      return res.status(404).json({ error: 'No quotes found' });
    }

    res.json(quotes[0]);
  } catch (error) {
    console.error('Error fetching random quote:', error);
    res.status(500).json({ error: 'Server error fetching quote' });
  }
});

module.exports = router;
