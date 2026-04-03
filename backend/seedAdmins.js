require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const User     = require('./models/User');

async function seedAdmins() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const admins = [
    { name: 'Admin One',   email: 'admin1@studymate.test', password: 'adminpassword1' },
    { name: 'Admin Two',   email: 'admin2@studymate.test', password: 'adminpassword2' },
    { name: 'Admin Three', email: 'admin3@studymate.test', password: 'adminpassword3' },
    { name: 'Admin Four',  email: 'admin4@studymate.test', password: 'adminpassword4' },
    { name: 'Admin Five',  email: 'admin5@studymate.test', password: 'adminpassword5' },
  ];

  for (const a of admins) {
    // Drop existing to avoid unique constraint errors if re-run
    await User.deleteOne({ email: a.email });
    
    const hash = await bcrypt.hash(a.password, 10);
    await new User({
      name: a.name,
      email: a.email,
      password: hash,
      role: 'admin',
      status: 'active'
    }).save();
    
    console.log(`✅ Admin created  →  ${a.email} / ${a.password}`);
  }
  
  console.log('All 5 admins created successfully!');
  process.exit(0);
}

seedAdmins().catch(console.error);
