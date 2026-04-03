const mongoose = require('mongoose');

async function dropLegacy() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/stress-releaser');
    const cols = await mongoose.connection.db.collections();
    for (const c of cols) {
      if (c.collectionName === 'studentcourses') {
        console.log('Dropping studentcourses indexes...');
        await c.dropIndexes();
      }
    }
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

dropLegacy();
