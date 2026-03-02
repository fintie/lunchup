const express = require('express');
const router = express.Router();
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
    const meeting = {
      id: Date.now().toString(), // Simple ID generation for demo
      hostId,
      attendees,
      meetingPoint,
      date,
      time,
      topic,
      description,
      createdAt: new Date(),
      status: 'scheduled'
    };

    // In a real implementation, you would save this to a database
    // For now, we'll just return the meeting object
    
    res.status(201).json(meeting);
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
    
    // This is a placeholder - in a real app, you'd have a Meeting model
    // and query for meetings where the user is either host or attendee
    const userMeetings = [];
    
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
    
    // In a real implementation, you would update the meeting in the database
    // For now, we'll just return a success message
    
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Placeholder response
    res.json({ 
      message: 'Meeting status updated successfully',
      meetingId,
      status
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;