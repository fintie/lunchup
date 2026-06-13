export function parseRoomWhitelist(value = '') {
  return value
    .split(',')
    .map((room) => room.trim())
    .filter(Boolean)
}

export function extractHighlight(text, marker = '#亮点') {
  const value = String(text || '').trim()
  if (!value.startsWith(marker)) return null

  const content = value.slice(marker.length).trim()
  return content || null
}

export function buildHighlightPayload({
  messageId,
  roomName,
  authorName,
  content,
  anonymiseAuthors,
  timestamp = new Date()
}) {
  return {
    sourceMessageId: String(messageId),
    roomName,
    authorName: anonymiseAuthors ? 'Anonymous' : authorName,
    content,
    messageTimestamp: timestamp.toISOString()
  }
}
