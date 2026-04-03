// Run once to create admin account:  node createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const User     = require('./models/User');

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteOne({ email: 'admin@studymate.test' });
  const hash = await bcrypt.hash('admin@123', 10);
  await new User({
    name: 'Admin', email: 'admin@studymate.test',
    password: hash, role: 'admin', status: 'active'
  }).save();
  console.log('✅ Admin created  →  admin@studymate.test / admin@123');
  process.exit(0);
}
createAdmin().catch(console.error);
