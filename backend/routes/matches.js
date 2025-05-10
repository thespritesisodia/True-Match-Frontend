const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MatchingService = require('../services/matchingService');

// Get potential matches for the current user
router.get('/potential', auth, async (req, res) => {
  try {
    const matches = await MatchingService.findPotentialMatches(req.user.id);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new match
router.post('/:userId', auth, async (req, res) => {
  try {
    const match = await MatchingService.createMatch(req.user.id, req.params.userId);
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all matches for the current user
router.get('/', auth, async (req, res) => {
  try {
    const matches = await Match.find({
      users: req.user.id,
      status: 'matched'
    }).populate('users', 'name photos bio');
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update match status (accept/reject)
router.patch('/:matchId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const match = await Match.findOneAndUpdate(
      {
        _id: req.params.matchId,
        users: req.user.id
      },
      { status },
      { new: true }
    );
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get match details
router.get('/:matchId', auth, async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.matchId,
      users: req.user.id
    }).populate('users', 'name photos bio');
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message in a match
router.post('/:matchId/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const match = await Match.findOneAndUpdate(
      {
        _id: req.params.matchId,
        users: req.user.id
      },
      {
        $push: {
          messages: {
            sender: req.user.id,
            content
          }
        }
      },
      { new: true }
    );
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a match
router.get('/:matchId/messages', auth, async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.matchId,
      users: req.user.id
    }).select('messages');
    res.json(match.messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 