const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const Meeting = require('../models/Meeting');

const populateMeeting = (query) => query
  .populate('host', 'name professionalBackground profilePicture')
  .populate('attendees', 'name professionalBackground profilePicture');

function requireUser(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.userId = decoded.userId;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Create a new meeting
router.post('/', requireUser, async (req, res) => {
  try {
    const { 
      hostId, 
      attendees, 
      location,
      meetingPoint, 
      date, 
      time, 
      topic, 
      description 
    } = req.body;

    if (!hostId || !Array.isArray(attendees) || attendees.length === 0 || !meetingPoint || !date || !time || !topic) {
      return res.status(400).json({
        message: 'hostId, attendees, meetingPoint, date, time, and topic are required'
      });
    }

    if (String(hostId) !== String(req.userId)) {
      return res.status(403).json({ message: 'You can only create meetings as yourself' });
    }

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

    const meeting = await Meeting.create({
      host: hostId,
      attendees,
      location,
      meetingPoint,
      date,
      time,
      topic,
      description
    });

    const populatedMeeting = await populateMeeting(Meeting.findById(meeting._id));
    res.status(201).json(populatedMeeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get meetings for a user
router.get('/user/:userId', requireUser, async (req, res) => {
  try {
    const { userId } = req.params;

    if (String(userId) !== String(req.userId)) {
      return res.status(403).json({ message: 'You can only view your own meetings' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userMeetings = await populateMeeting(
      Meeting.find({
        $or: [
          { host: userId },
          { attendees: userId }
        ]
      }).sort({ date: 1, time: 1 })
    );
    
    res.json(userMeetings);
 } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update meeting status
router.put('/:meetingId/status', requireUser, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const existingMeeting = await Meeting.findById(meetingId);
    if (!existingMeeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const canManage = String(existingMeeting.host) === String(req.userId)
      || existingMeeting.attendees.some((attendeeId) => String(attendeeId) === String(req.userId));

    if (!canManage) {
      return res.status(403).json({ message: 'Not authorized to update this meeting' });
    }

    existingMeeting.status = status;
    await existingMeeting.save();

    const meeting = await populateMeeting(Meeting.findById(existingMeeting._id));

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
