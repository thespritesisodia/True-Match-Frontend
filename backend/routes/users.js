const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const {
    firstName,
    lastName,
    gender,
    dateOfBirth,
    religion,
    education,
    occupation,
    aboutMe,
    location,
  } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (religion) user.religion = religion;
    if (education) user.education = education;
    if (occupation) user.occupation = occupation;
    if (aboutMe) user.aboutMe = aboutMe;
    if (location) user.location = location;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/search
// @desc    Search for potential matches
// @access  Private
router.post('/search', auth, async (req, res) => {
  const {
    gender,
    ageRange,
    religion,
    education,
    location,
  } = req.body;

  try {
    // Build search query
    const query = {
      _id: { $ne: req.user.id }, // Exclude current user
      gender: gender || { $exists: true },
      religion: religion || { $exists: true },
      education: education || { $exists: true },
    };

    // Add age range filter if provided
    if (ageRange) {
      const today = new Date();
      const minAge = new Date(today.getFullYear() - ageRange[1] - 1, today.getMonth(), today.getDate());
      const maxAge = new Date(today.getFullYear() - ageRange[0], today.getMonth(), today.getDate());
      query.dateOfBirth = { $gte: minAge, $lte: maxAge };
    }

    // Add location filter if provided
    if (location) {
      query['location.city'] = { $regex: location, $options: 'i' };
    }

    const users = await User.find(query)
      .select('-password')
      .limit(20);

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/connect
// @desc    Send connection request
// @access  Private
router.post('/connect', auth, async (req, res) => {
  const { profileId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(profileId);

    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if connection request already exists
    if (user.connections.some(conn => conn.user.toString() === profileId)) {
      return res.status(400).json({ msg: 'Connection request already sent' });
    }

    // Add connection request
    user.connections.push({
      user: profileId,
      status: 'pending',
      date: Date.now(),
    });

    await user.save();
    res.json(user.connections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/connect/:id
// @desc    Accept/Reject connection request
// @access  Private
router.put('/connect/:id', auth, async (req, res) => {
  const { status } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const connection = user.connections.find(
      conn => conn._id.toString() === req.params.id
    );

    if (!connection) {
      return res.status(404).json({ msg: 'Connection request not found' });
    }

    connection.status = status;
    await user.save();

    // If accepted, add connection to the other user as well
    if (status === 'accepted') {
      const otherUser = await User.findById(connection.user);
      otherUser.connections.push({
        user: req.user.id,
        status: 'accepted',
        date: Date.now(),
      });
      await otherUser.save();
    }

    res.json(user.connections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 