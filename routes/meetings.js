const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const User = require('../models/User');

// Create a new meeting
router.post('/', async (req, res) => {
  try {
    const {
      hostId,
      attendees,
      meetingPoint,
      date,
      time,
      topic,
      description
    } = req.body;

    // Validate host exists
    const host = await User.findById(hostId);
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }

    // Validate attendees exist
    const attendeeUsers = await User.find({ _id: { $in: attendees } });
    if (attendeeUsers.length !== attendees.length) {
      return res.status(404).json({ message: 'One or more attendees not found' });
    }

    // Create meeting object (in a real app, you'd have a Meeting model)
    const meeting = new Meeting({
      hostId,
      attendees,
      meetingPoint,
      date,
      time,
      topic,
      description,
    });

    const savedMeeting = await meeting.save();
    res.status(201).json(savedMeeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get meetings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // In a real implementation, you would fetch meetings from a database
    // For now, we'll return an empty array as an example

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userMeetings = await Meeting.find({
      $or: [{ hostId: userId }, { attendees: userId }]
    });
    res.json(userMeetings);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update meeting status
router.put('/:meetingId/status', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status } = req.body;
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const meeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { status },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(meeting);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;