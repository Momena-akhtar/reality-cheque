import mongoose from 'mongoose';
import { connectToDb } from '../config/db';
import Admin from '../models/admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createAdminAccount() {
  try {
    // Connect to database
    await connectToDb();
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@menubot.com' });
    
    if (existingAdmin) {
      console.log('❌ Admin account already exists with email: admin@menubot.com');
      console.log('If you want to update the password, please delete the existing account first.');
      process.exit(0);
    }

    // Create new admin account
    const adminData = {
      username: 'admin',
      email: 'admin@menubot.com',
      password: 'admin123'
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@menubot.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Username: admin');
    console.log('\nYou can now log in to the admin panel with these credentials.');

  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run the script
createAdminAccount(); 