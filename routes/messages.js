const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

let Message;
try { Message = require('../models/Message'); } catch {}

// In-memory store for demo mode
const demoMessages = [];
let demoMsgId = 1;

// Track which demo users have already been seeded
const seededUsers = new Set();

function seedDemoData(userId) {
  if (seededUsers.has(userId)) return;
  seededUsers.add(userId);

  const now = Date.now();

  // Pending connection request from Emma Wilson
  demoMessages.push({
    _id: `dmsg_${demoMsgId++}`,
    senderId: 'sample1', receiverId: userId,
    senderName: 'Emma Wilson', receiverName: 'You',
    senderAvatar: 'https://i.pravatar.cc/300?img=5',
    content: 'Emma Wilson wants to connect with you.',
    type: 'connection_request', connectionStatus: 'pending',
    read: false, createdAt: new Date(now - 1000 * 60 * 10)
  });

  // Pending connection request from Oliver Brown
  demoMessages.push({
    _id: `dmsg_${demoMsgId++}`,
    senderId: 'sample8', receiverId: userId,
    senderName: 'Oliver Brown', receiverName: 'You',
    senderAvatar: 'https://i.pravatar.cc/300?img=56',
    content: 'Oliver Brown wants to connect with you.',
    type: 'connection_request', connectionStatus: 'pending',
    read: false, createdAt: new Date(now - 1000 * 60 * 5)
  });

  // Existing accepted conversation with Liam Chen
  demoMessages.push({
    _id: `dmsg_${demoMsgId++}`,
    senderId: 'sample2', receiverId: userId,
    senderName: 'Liam Chen', receiverName: 'You',
    content: 'Hey! Saw your profile on LunchUp — your background in product looks really interesting 👋',
    type: 'message', read: true, createdAt: new Date(now - 1000 * 60 * 60 * 2)
  });
  demoMessages.push({
    _id: `dmsg_${demoMsgId++}`,
    senderId: userId, receiverId: 'sample2',
    senderName: 'You', receiverName: 'Liam Chen',
    content: 'Thanks! I\'ve been following the work Atlassian does. Would love to catch up over lunch sometime.',
    type: 'message', read: true, createdAt: new Date(now - 1000 * 60 * 60 * 2 + 1000 * 60)
  });
  demoMessages.push({
    _id: `dmsg_${demoMsgId++}`,
    senderId: 'sample2', receiverId: userId,
    senderName: 'Liam Chen', receiverName: 'You',
    content: 'Absolutely! I\'m free Thursday arvo in Sydney CBD. Want to grab coffee at Circular Quay?',
    type: 'message', read: false, createdAt: new Date(now - 1000 * 60 * 30)
  });

  // Existing conversation with Noah Thompson
  demoMessages.push({
    _id: `dmsg_${demoMsgId++}`,
    senderId: 'sample4', receiverId: userId,
    senderName: 'Noah Thompson', receiverName: 'You',
    content: 'Great connecting on LunchUp! I\'m working on some ML projects — would be awesome to find a builder to co-found something 🚀',
    type: 'message', read: true, createdAt: new Date(now - 1000 * 60 * 60 * 24)
  });
  demoMessages.push({
    _id: `dmsg_${demoMsgId++}`,
    senderId: userId, receiverId: 'sample4',
    senderName: 'You', receiverName: 'Noah Thompson',
    content: 'That sounds exciting! What kind of ML projects are you thinking?',
    type: 'message', read: true, createdAt: new Date(now - 1000 * 60 * 60 * 23)
  });
  demoMessages.push({
    _id: `dmsg_${demoMsgId++}`,
    senderId: 'sample4', receiverId: userId,
    senderName: 'Noah Thompson', receiverName: 'You',
    content: 'Fraud detection and anomaly detection — fintech space. Let me know if you want to explore it together!',
    type: 'message', read: false, createdAt: new Date(now - 1000 * 60 * 60 * 22)
  });
}

const DEMO_REPLIES = [
  "Hey! Great to connect 👋 Looking forward to catching up over lunch!",
  "Thanks for reaching out! I'd love to grab coffee and chat.",
  "Awesome, let's definitely connect! I'm free next week.",
  "Great to meet you on LunchUp! Let's make something happen 🚀",
];

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.userId = String(decoded.userId);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const isDemo = (id) => String(id).startsWith('demo_') || String(id).startsWith('sample');

// Send connection request
router.post('/connect', authMiddleware, async (req, res) => {
  const { receiverId, receiverName, senderName, senderAvatar } = req.body;

  if (isDemo(req.userId) || isDemo(receiverId)) {
    const existing = demoMessages.find(m =>
      m.type === 'connection_request' && m.senderId === req.userId && m.receiverId === receiverId
    );
    if (existing) return res.json({ success: true, alreadySent: true });

    const msg = {
      _id: `dmsg_${demoMsgId++}`,
      senderId: req.userId, receiverId,
      senderName, receiverName, senderAvatar,
      content: `${senderName} wants to connect with you.`,
      type: 'connection_request',
      connectionStatus: 'pending',
      read: false, createdAt: new Date()
    };
    demoMessages.push(msg);

    // Sample users auto-accept after 2s and send a welcome message
    if (String(receiverId).startsWith('sample')) {
      setTimeout(() => {
        msg.connectionStatus = 'accepted';
        demoMessages.push({
          _id: `dmsg_${demoMsgId++}`,
          senderId: receiverId, receiverId: req.userId,
          senderName: receiverName, receiverName: senderName,
          content: DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)],
          type: 'message', read: false, createdAt: new Date()
        });
      }, 2000);
    }

    return res.json({ success: true, message: msg });
  }

  try {
    const existing = await Message.findOne({ type: 'connection_request', senderId: req.userId, receiverId });
    if (existing) return res.json({ success: true, alreadySent: true });
    const msg = await new Message({
      senderId: req.userId, receiverId, senderName, receiverName, senderAvatar,
      content: `${senderName} wants to connect with you.`,
      type: 'connection_request', connectionStatus: 'pending', read: false
    }).save();
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Accept / reject a connection request
router.put('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;

  const demoMsg = demoMessages.find(m => m._id === req.params.id);
  if (demoMsg) {
    demoMsg.connectionStatus = status;
    demoMsg.read = true;
    if (status === 'accepted') {
      demoMessages.push({
        _id: `dmsg_${demoMsgId++}`,
        senderId: demoMsg.receiverId, receiverId: demoMsg.senderId,
        senderName: demoMsg.receiverName, receiverName: demoMsg.senderName,
        content: "Connection accepted! Let's chat 👋",
        type: 'message', read: false, createdAt: new Date()
      });
    }
    return res.json({ success: true, message: demoMsg });
  }

  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { connectionStatus: status, read: true }, { new: true });
    if (!msg) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Inbox: pending connection requests + conversation list + unread count
router.get('/inbox', authMiddleware, async (req, res) => {
  const uid = req.userId;

  if (isDemo(uid)) {
    seedDemoData(uid);

    const connectionRequests = demoMessages.filter(m =>
      m.type === 'connection_request' && m.receiverId === uid && m.connectionStatus === 'pending'
    );

    const chatMsgs = demoMessages.filter(m =>
      m.type === 'message' && (m.senderId === uid || m.receiverId === uid)
    );

    const convMap = {};
    chatMsgs.forEach(m => {
      const otherId   = m.senderId === uid ? m.receiverId : m.senderId;
      const otherName = m.senderId === uid ? m.receiverName : m.senderName;
      const otherAvatar = m.senderId === uid ? null : m.senderAvatar;
      if (!convMap[otherId] || new Date(m.createdAt) > new Date(convMap[otherId].lastMessage.createdAt)) {
        convMap[otherId] = { userId: otherId, name: otherName, avatar: otherAvatar, lastMessage: m, unreadCount: convMap[otherId]?.unreadCount || 0 };
      }
      if (!m.read && m.receiverId === uid) convMap[otherId].unreadCount = (convMap[otherId].unreadCount || 0) + 1;
    });

    const conversations = Object.values(convMap).sort((a, b) =>
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );
    const unreadCount = connectionRequests.length + conversations.reduce((s, c) => s + c.unreadCount, 0);
    return res.json({ connectionRequests, conversations, unreadCount });
  }

  try {
    const connectionRequests = await Message.find({ type: 'connection_request', receiverId: uid, connectionStatus: 'pending' }).sort({ createdAt: -1 });
    const chatMsgs = await Message.find({ type: 'message', $or: [{ senderId: uid }, { receiverId: uid }] }).sort({ createdAt: -1 });

    const convMap = {};
    chatMsgs.forEach(m => {
      const otherId   = String(m.senderId) === uid ? String(m.receiverId) : String(m.senderId);
      const otherName = String(m.senderId) === uid ? m.receiverName : m.senderName;
      if (!convMap[otherId]) convMap[otherId] = { userId: otherId, name: otherName, lastMessage: m, unreadCount: 0 };
      if (!m.read && String(m.receiverId) === uid) convMap[otherId].unreadCount++;
    });

    const conversations = Object.values(convMap);
    const unreadCount = connectionRequests.length + conversations.reduce((s, c) => s + c.unreadCount, 0);
    res.json({ connectionRequests, conversations, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get conversation messages with one user
router.get('/conversation/:userId', authMiddleware, async (req, res) => {
  const myId = req.userId;
  const otherId = req.params.userId;

  if (isDemo(myId) || isDemo(otherId)) {
    seedDemoData(myId);
    const msgs = demoMessages
      .filter(m => m.type === 'message' &&
        ((m.senderId === myId && m.receiverId === otherId) ||
         (m.senderId === otherId && m.receiverId === myId)))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    msgs.forEach(m => { if (m.receiverId === myId) m.read = true; });
    return res.json(msgs);
  }

  try {
    const msgs = await Message.find({
      type: 'message',
      $or: [{ senderId: myId, receiverId: otherId }, { senderId: otherId, receiverId: myId }]
    }).sort({ createdAt: 1 });
    await Message.updateMany({ senderId: otherId, receiverId: myId, read: false }, { read: true });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send a message
router.post('/send', authMiddleware, async (req, res) => {
  const { receiverId, receiverName, content, senderName } = req.body;

  if (isDemo(req.userId) || isDemo(receiverId)) {
    const msg = {
      _id: `dmsg_${demoMsgId++}`,
      senderId: req.userId, receiverId,
      senderName: senderName || 'You', receiverName,
      content, type: 'message', read: false, createdAt: new Date()
    };
    demoMessages.push(msg);

    if (String(receiverId).startsWith('sample')) {
      const replies = [
        "Sounds great! Let's make it happen 🚀",
        "Totally agree! When are you free?",
        "Love that idea! Let's catch up soon.",
        "Absolutely, I'm in! 👍",
        "Great thinking! Let's plan something.",
      ];
      setTimeout(() => {
        demoMessages.push({
          _id: `dmsg_${demoMsgId++}`,
          senderId: receiverId, receiverId: req.userId,
          senderName: receiverName, receiverName: senderName || 'You',
          content: replies[Math.floor(Math.random() * replies.length)],
          type: 'message', read: false, createdAt: new Date()
        });
      }, 1500);
    }

    return res.json({ success: true, message: msg });
  }

  try {
    const msg = await new Message({ senderId: req.userId, receiverId, senderName, receiverName, content, type: 'message', read: false }).save();
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
