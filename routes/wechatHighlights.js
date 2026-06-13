const express = require('express');
const WechatHighlight = require('../models/WechatHighlight');

const router = express.Router();

function requireIngestKey(req, res, next) {
  const configuredKey = process.env.WECHAT_HIGHLIGHT_INGEST_KEY;
  const suppliedKey = req.get('x-ingest-key');

  if (!configuredKey) {
    return res.status(503).json({ message: 'Wechat highlight ingestion is not configured' });
  }

  if (!suppliedKey || suppliedKey !== configuredKey) {
    return res.status(401).json({ message: 'Invalid ingest key' });
  }

  return next();
}

router.get('/', async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 20;

    const items = await WechatHighlight.find()
      .sort({ messageTimestamp: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load WeChat highlights' });
  }
});

router.post('/', requireIngestKey, async (req, res) => {
  try {
    const {
      sourceMessageId,
      roomName,
      authorName = 'Anonymous',
      content,
      messageTimestamp
    } = req.body;

    if (!sourceMessageId || !roomName || !content || !messageTimestamp) {
      return res.status(400).json({
        message: 'sourceMessageId, roomName, content, and messageTimestamp are required'
      });
    }

    const parsedTimestamp = new Date(messageTimestamp);
    if (Number.isNaN(parsedTimestamp.getTime())) {
      return res.status(400).json({ message: 'messageTimestamp must be a valid date' });
    }

    const item = await WechatHighlight.findOneAndUpdate(
      { sourceMessageId: String(sourceMessageId) },
      {
        $setOnInsert: {
          sourceMessageId: String(sourceMessageId),
          roomName: String(roomName),
          authorName: String(authorName),
          content: String(content),
          messageTimestamp: parsedTimestamp,
          source: 'wechat'
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(201).json({ success: true, item });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(200).json({ success: true, duplicate: true });
    }
    return res.status(500).json({ message: 'Failed to store WeChat highlight' });
  }
});

module.exports = router;
