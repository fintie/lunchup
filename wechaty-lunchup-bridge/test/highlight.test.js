import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildHighlightPayload,
  extractHighlight,
  parseRoomWhitelist
} from '../src/highlight.js'

test('parseRoomWhitelist trims and removes empty entries', () => {
  assert.deepEqual(
    parseRoomWhitelist('LunchUp Sydney, LunchUp Founders,'),
    ['LunchUp Sydney', 'LunchUp Founders']
  )
})

test('extractHighlight only accepts marked messages', () => {
  assert.equal(extractHighlight('normal message'), null)
  assert.equal(extractHighlight('#亮点  Great product insight'), 'Great product insight')
  assert.equal(extractHighlight('#亮点'), null)
})

test('buildHighlightPayload can anonymise authors', () => {
  const timestamp = new Date('2026-06-13T01:00:00.000Z')
  const payload = buildHighlightPayload({
    messageId: 'message-1',
    roomName: 'LunchUp Sydney',
    authorName: 'Nic',
    content: 'A useful idea',
    anonymiseAuthors: true,
    timestamp
  })

  assert.deepEqual(payload, {
    sourceMessageId: 'message-1',
    roomName: 'LunchUp Sydney',
    authorName: 'Anonymous',
    content: 'A useful idea',
    messageTimestamp: '2026-06-13T01:00:00.000Z'
  })
})
