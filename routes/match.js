const express = require('express');
const router = express.Router();
const User = require('../models/User');

// AI Matching Algorithm - Get suggested matches
router.get('/suggest', async (req, res) => {
  try {
    const { userId, maxResults = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    // Get the requesting user
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find other users excluding the current user
    const otherUsers = await User.find({ _id: { $ne: userId } });

    // Score users based on similarity
    const scoredUsers = otherUsers.map(user => {
      let score = 0;

      // Compare professional backgrounds
      if (currentUser.professionalBackground === user.professionalBackground) {
        score += 30;
      }

      // Compare skills
      const commonSkills = currentUser.skills.filter(skill =>
        user.skills.includes(skill)
      );
      score += commonSkills.length * 10;

      // Compare preferred topics
      const commonTopics = currentUser.preferredTopics.filter(topic =>
        user.preferredTopics.includes(topic)
      );
      score += commonTopics.length * 15;

      // Compare locations
      if (currentUser.preferredLocation === user.preferredLocation) {
        score += 25;
      }

      // Compare meeting points
      if (currentUser.preferredMeetingPoint === user.preferredMeetingPoint) {
        score += 20;
      }

      return {
        user: user.toObject(),
        score
      };
    });

    // Sort by score in descending order
    scoredUsers.sort((a, b) => b.score - a.score);

    // Return top matches
    const topMatches = scoredUsers.slice(0, maxResults).map(item => ({
      ...item.user,
      matchScore: item.score
    }));

    res.json(topMatches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search users by criteria
router.post('/search', async (req, res) => {
  try {
    const { query, location, topic, skill } = req.body;

    const searchCriteria = {};

    if (query) {
      searchCriteria.$or = [
        { name: { $regex: query, $options: 'i' } },
        { professionalBackground: { $regex: query, $options: 'i' } }
      ];
    }

    if (location) {
      searchCriteria.preferredLocation = { $regex: location, $options: 'i' };
    }

    if (topic) {
      searchCriteria.preferredTopics = { $in: [new RegExp(topic, 'i')] };
    }

    if (skill) {
      searchCriteria.skills = { $in: [new RegExp(skill, 'i')] };
    }

    const users = await User.find(searchCriteria).limit(20);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
