# Wechaty LunchUp Bridge

This service monitors explicitly allowed WeChat groups and publishes messages
that start with `#亮点` to the LunchUp Live page.

It does not upload unmarked messages.

## Setup

1. Configure LunchUp with `WECHAT_HIGHLIGHT_INGEST_KEY`.
2. Copy `.env.example` to `.env` and use the same value for
   `LUNCHUP_INGEST_KEY`.
3. Set exact group names in `WECHAT_ROOM_WHITELIST`.
4. Keep `DRY_RUN=true` for the first login and verify the console output.
5. Run `npm install`, then `npm start`, and scan the QR code.
6. After verification, set `DRY_RUN=false`.

Example group message:

```text
#亮点 我们应该在活动结束后自动匹配有共同目标的参与者。
```

## Privacy and account safety

- Obtain group-member consent before monitoring or publishing messages.
- Use a dedicated WeChat account and only add it to approved groups.
- Prefer `ANONYMISE_AUTHORS=true` unless displaying names is explicitly allowed.
- Web-based unofficial Puppets can trigger WeChat account restrictions. Use a
  maintained, licensed Puppet provider for production and set it through
  `WECHATY_PUPPET` and `WECHATY_PUPPET_TOKEN`.
