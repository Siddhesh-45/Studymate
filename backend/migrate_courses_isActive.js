const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./models/Course');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Update all courses that don't have isActive set, setting them to false
    const result = await Course.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: false } }
    );

    console.log(`Migration successful. Modified ${result.modifiedCount} courses.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
