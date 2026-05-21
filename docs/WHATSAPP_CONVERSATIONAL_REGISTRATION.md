# WhatsApp Conversational Registration Spec

## Goal
Turn Lunchup event registration from a one-tap WhatsApp handoff into a conversational WhatsApp registration flow backed by Lunchup webhooks and registration state.

## User flow
1. User clicks **Register via WhatsApp** on an event card.
2. Lunchup opens WhatsApp to the business number with a prefilled message containing an event reference.
3. User sends the message.
4. Lunchup receives the inbound WhatsApp webhook.
5. Lunchup resolves the event, creates or updates a registration, and replies in chat.
6. Lunchup collects any missing details such as attendee name.
7. Lunchup confirms the registration and can optionally offer future event updates.

## Frontend changes
Generate a prefilled message that includes a stable event reference.

Example:
- `Hi, I want to register for AI Founder Breakfast at UTS. REF: EVT_<eventId>`

Preferred button behavior:
- try `window.open(url, '_blank', 'noopener,noreferrer')`
- fallback to `window.location.href = url`

## Environment variables
Required for Meta Cloud API:
- `WHATSAPP_EVENT_NUMBER`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_API_VERSION` (default `v20.0`)

## Proposed models

### EventRegistration
Use phone number as the durable identity for WhatsApp registrations.

Fields:
- `eventId: ObjectId`
- `userId: String` (optional)
- `phoneNumber: String`
- `attendeeName: String`
- `channel: String` (`whatsapp`)
- `source: String` (`web_button`, `whatsapp_inbound`, `admin`)
- `status: String` (`draft`, `awaiting_name`, `confirmed`, `cancelled`)
- `shareUrl: String`
- `notes: String`
- `conversationId: ObjectId`
- timestamps

Indexes:
- unique `{ eventId, phoneNumber, channel }`
- index `{ phoneNumber, status }`

### WhatsAppConversation
Fields:
- `phoneNumber: String`
- `userId: String` (optional)
- `currentEventId: ObjectId`
- `currentRegistrationId: ObjectId`
- `state: String` (`idle`, `awaiting_name`, `confirmed`, `subscribed`, `stopped`)
- `lastInboundText: String`
- `lastOutboundText: String`
- `profileName: String`
- `metadata: Object`
- `lastMessageAt: Date`
- timestamps

Indexes:
- unique `{ phoneNumber: 1 }`

### WhatsAppMessageLog
Fields:
- `phoneNumber: String`
- `direction: String` (`inbound`, `outbound`)
- `providerMessageId: String`
- `eventId: ObjectId`
- `registrationId: ObjectId`
- `messageType: String`
- `messageText: String`
- `deliveryStatus: String`
- `rawPayload: Object`
- timestamps

Indexes:
- `{ phoneNumber: 1, createdAt: -1 }`
- `{ providerMessageId: 1 }`

## Proposed routes

### GET `/api/whatsapp/webhook`
Meta verification handshake.
- validate `hub.verify_token`
- return `hub.challenge` if valid
- otherwise `403`

### POST `/api/whatsapp/webhook`
Inbound webhook receiver.
- parse sender phone number
- parse profile name and message text
- log inbound payload
- resolve event by `REF: EVT_<id>` or fallback matching
- create or update conversation
- create or update registration
- send outbound reply

## Proposed services
- `services/whatsapp.js`: provider API wrapper for outbound messages
- `services/whatsappFlow.js`: webhook parsing, state transitions, event resolution, registration updates

## Conversation states
- `idle`
- `awaiting_event`
- `awaiting_name`
- `awaiting_confirmation`
- `confirmed`
- `subscribed`
- `stopped`

## Core logic

### If inbound text contains `REF: EVT_<id>`
1. Find event by id.
2. Upsert conversation by `phoneNumber`.
3. Upsert registration by `{ eventId, phoneNumber, channel: 'whatsapp' }`.
4. If attendee name missing, ask for it and set `awaiting_name`.
5. Otherwise confirm registration.

### If inbound text says register without a ref
1. Try fuzzy match against event titles.
2. If one clear match, continue.
3. If ambiguous, ask which event.
4. If no match, send fallback help.

### If conversation is `awaiting_name`
1. Treat message text as the name.
2. Update `attendeeName`.
3. Set registration `status=confirmed`.
4. Set conversation `state=confirmed`.
5. Send confirmation.

### If inbound text is `STOP`
1. Set conversation `state=stopped`.
2. Disable follow-up messaging.
3. Send opt-out confirmation.

## Recommended reply templates
Ask for name:
> Great, I can help with that. You’re registering for **{{title}}** on **{{time}}** at **{{venue}}**. What name should I register you under?

Confirmed:
> Done, **{{name}}**. You’re registered for **{{title}}**. Event link: {{url}}

Ambiguous:
> I found a few matching events. Reply with the event name you want.

Fallback:
> I can help you register for Lunchup events on WhatsApp. Try sending: “Register me for {{title}}”.

STOP:
> You’re opted out of WhatsApp follow-ups. Message again anytime to restart.

## Recommended implementation order
1. Add `WhatsAppConversation` model.
2. Add `WhatsAppMessageLog` model.
3. Refactor `EventRegistration` uniqueness toward `phoneNumber`.
4. Add `routes/whatsapp.js`.
5. Add `services/whatsapp.js`.
6. Add `services/whatsappFlow.js`.
7. Update the event button to include a stable event reference.
8. Test end-to-end with a real WhatsApp sandbox/business account.

## MVP definition of done
- user clicks the event button
- WhatsApp opens to the business number
- prefilled message includes event reference
- Lunchup receives inbound webhook
- Lunchup asks for missing details
- Lunchup confirms the registration
- Lunchup stores the registration keyed by phone number
