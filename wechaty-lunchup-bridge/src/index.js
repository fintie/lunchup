import 'dotenv/config'
import qrcodeTerminal from 'qrcode-terminal'
import { ScanStatus, WechatyBuilder } from 'wechaty'
import {
  buildHighlightPayload,
  extractHighlight,
  parseRoomWhitelist
} from './highlight.js'

const requiredVariables = ['LUNCHUP_API_URL', 'LUNCHUP_INGEST_KEY']
const missingVariables = requiredVariables.filter((name) => !process.env[name])

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`)
}

const roomWhitelist = new Set(parseRoomWhitelist(process.env.WECHAT_ROOM_WHITELIST))
if (roomWhitelist.size === 0) {
  throw new Error('WECHAT_ROOM_WHITELIST must contain at least one exact group name')
}

const marker = process.env.HIGHLIGHT_MARKER || '#亮点'
const anonymiseAuthors = process.env.ANONYMISE_AUTHORS === 'true'
const dryRun = process.env.DRY_RUN === 'true'
const apiBaseUrl = process.env.LUNCHUP_API_URL.replace(/\/+$/, '')
const puppet = process.env.WECHATY_PUPPET || 'wechaty-puppet-wechat4u'
const puppetOptions = process.env.WECHATY_PUPPET_TOKEN
  ? { token: process.env.WECHATY_PUPPET_TOKEN }
  : undefined

async function publishHighlight(payload) {
  if (dryRun) {
    console.log('[dry-run] Would publish highlight:', payload)
    return
  }

  const response = await fetch(`${apiBaseUrl}/wechat-highlights`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-ingest-key': process.env.LUNCHUP_INGEST_KEY
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000)
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`LunchUp returned ${response.status}: ${body}`)
  }
}

const bot = WechatyBuilder.build({
  name: process.env.WECHATY_BOT_NAME || 'lunchup-highlight-bot',
  puppet,
  puppetOptions
})

bot.on('scan', (qrcode, status) => {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    qrcodeTerminal.generate(qrcode, { small: true })
  }
})

bot.on('login', (user) => {
  console.log(`Logged in as ${user.name()}`)
  console.log(`Monitoring: ${Array.from(roomWhitelist).join(', ')}`)
  console.log(`Highlight marker: ${marker}; dry-run: ${dryRun}`)
})

bot.on('logout', (user) => {
  console.log(`Logged out: ${user.name()}`)
})

bot.on('message', async (message) => {
  try {
    const room = message.room()
    const talker = message.talker()

    if (!room || talker.self() || message.type() !== bot.Message.Type.Text) return

    const roomName = await room.topic()
    if (!roomWhitelist.has(roomName)) return

    const content = extractHighlight(message.text(), marker)
    if (!content) return

    const payload = buildHighlightPayload({
      messageId: message.id,
      roomName,
      authorName: talker.name(),
      content,
      anonymiseAuthors
    })

    await publishHighlight(payload)
    console.log(`Published highlight from "${roomName}" (${payload.sourceMessageId})`)
  } catch (error) {
    console.error('Failed to process message:', error.message)
  }
})

bot.on('error', (error) => {
  console.error('Wechaty error:', error)
})

await bot.start()
