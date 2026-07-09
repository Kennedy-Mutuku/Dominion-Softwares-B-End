const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dominion_softwares');
    
    const adminEmail = 'dominionsoftwares@gmail.com';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = new User({
        name: 'Dominion Admin',
        email: adminEmail,
        password: '1234',
        role: 'admin',
        isVerified: true
      });
      await admin.save();
      console.log('Admin user created successfully');
    } else {
      admin.password = '1234';
      admin.role = 'admin';
      await admin.save();
      console.log('Admin user updated successfully');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
};

seedAdmin();
