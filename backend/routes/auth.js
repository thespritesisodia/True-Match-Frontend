const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendVerificationEmail, sendOTP } = require('../utils/emailService');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, email, name, password, age, gender, location, bio } = req.body;
    console.log('Registration attempt:', { phoneNumber, email, name, age, gender, location });

    // Check if user exists
    let user = await User.findOne({ $or: [{ phoneNumber }, { email }] });
    if (user) {
      console.log('User already exists:', { phoneNumber, email });
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      phoneNumber,
      email,
      name,
      password,
      age,
      gender,
      location,
      bio,
      isVerified: true
    });

    await user.save();
    console.log('User created successfully:', { id: user._id, name: user.name });

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('Error creating JWT:', err);
          throw err;
        }
        res.json({ 
          token,
          user: {
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber
          }
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/auth/verify-email
// @desc    Verify user email
// @access  Public
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ msg: 'Email verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/send-otp
// @desc    Send OTP to phone number
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber, email } = req.body;

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Check if user exists
    let user = await User.findOne({ phoneNumber });
    
    if (user) {
      // Update existing user's OTP
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // Create new user with OTP
      user = new User({
        phoneNumber,
        email,
        otp,
        otpExpires
      });
      await user.save();
    }

    // Send OTP via email
    await sendVerificationEmail(email, otp);

    res.json({ msg: 'OTP sent successfully to your email' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and complete registration
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp, name, password, dateOfBirth, gender, bio } = req.body;

    const user = await User.findOne({
      phoneNumber,
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Update user details
    user.name = name;
    user.password = password;
    user.dateOfBirth = dateOfBirth;
    user.gender = gender;
    user.bio = bio;
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', { 
      id: user._id,
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison:', {
      providedPassword: password,
      hashedPasswordInDB: user.password,
      isMatch
    });

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 