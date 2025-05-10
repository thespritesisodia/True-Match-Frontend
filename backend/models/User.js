const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  location: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  interests: [{
    type: String
  }],
  photos: [{
    type: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: String,
  otpExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Create test user if it doesn't exist
UserSchema.statics.createTestUser = async function() {
  try {
    const testUser = await this.findOne({ email: 'test@example.com' });
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      const newUser = new this({
        phoneNumber: '+911234567890',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        age: 25,
        gender: 'male',
        location: 'Test City',
        bio: 'This is a test account',
        isVerified: true
      });
      await newUser.save();
      console.log('Test user created successfully');
    } else {
      // Update existing test user's password
      const hashedPassword = await bcrypt.hash('test123', 10);
      testUser.password = hashedPassword;
      await testUser.save();
      console.log('Test user password updated');
    }
  } catch (error) {
    console.error('Error creating/updating test user:', error);
  }
};

const User = mongoose.model('User', UserSchema);

// Create test user when the model is initialized
User.createTestUser();

module.exports = User; 