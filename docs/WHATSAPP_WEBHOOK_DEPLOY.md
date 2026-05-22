# WhatsApp Webhook Deploy and Sandbox Test

## Required backend env vars
Set these on the `lunchup-api` service before testing inbound WhatsApp:

- `WHATSAPP_EVENT_NUMBER` = destination number shown in the frontend share link, for example `61433440419`
- `WHATSAPP_ACCESS_TOKEN` = Meta Cloud API permanent or long-lived token
- `WHATSAPP_PHONE_NUMBER_ID` = Meta Cloud API phone number id
- `WHATSAPP_VERIFY_TOKEN` = shared secret used for webhook verification
- `WHATSAPP_API_VERSION` = optional, defaults to `v20.0`

## Render setup
In Render, open the `lunchup-api` service and set the env vars above. Then redeploy.

If using `render.yaml`, make sure all WhatsApp env vars are declared with `sync: false` so values can be provided securely in Render.

## Meta webhook setup
Use this callback URL:

- `https://<your-api-domain>/api/whatsapp/webhook`

Use this verify token:

- exactly the same value as `WHATSAPP_VERIFY_TOKEN`

Subscribe the app to WhatsApp message webhooks after the verification handshake succeeds.

## Recommended sandbox test
1. Confirm deploy is live:
   - `GET /health`
   - `GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=1234`
2. Open an event’s **Register via WhatsApp** button from the Lunchup frontend.
3. Confirm the prefilled message includes `REF: EVT_<eventId>`.
4. Send the message from a WhatsApp number that is allowed in your Meta test setup.
5. Expected behavior:
   - Lunchup receives the webhook
   - if no profile name is available, it asks for a name
   - replying with the name confirms the registration
   - `STOP` moves the conversation to `stopped`
6. Inspect Mongo collections:
   - `whatsappconversations`
   - `eventregistrations`

## Useful manual checks
- Missing credentials should not crash the webhook flow. Outbound send attempts return `reason: 'missing-provider-config'`.
- Local sanity script:
  - `node scripts/testWhatsAppFlow.js`

## Known caveat
Requiring `server.js` or booting the full app also starts periodic content refresh jobs for news and opportunities. For flow-only checks, prefer route/service-level scripts or deployed webhook testing instead of full app boot when possible.
