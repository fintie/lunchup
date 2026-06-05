const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const challenges = require('../data/challenges.json');

const challengeParticipants = {};

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/current', (req, res) => {
  const current = challenges[0] || null;
  if (!current) return res.json(null);
  const count = (challengeParticipants[current.id] || []).length;
  res.json({ ...current, participantCount: count });
});

router.post('/:id/join', authMiddleware, (req, res) => {
  const { id } = req.params;
  const challenge = challenges.find(c => c.id === id);
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
  if (!challengeParticipants[id]) challengeParticipants[id] = [];
  if (!challengeParticipants[id].includes(req.userId)) {
    challengeParticipants[id].push(req.userId);
  }
  res.json({ success: true, participantCount: challengeParticipants[id].length });
});

module.exports = router;
