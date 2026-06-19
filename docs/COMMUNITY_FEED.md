# Community Feed

The Live page reads `/api/community-feed`, backed by `data/communityFeed.json`.

`scripts/updateCommunityFeed.js` refreshes the feed at most once per day. It collects Australian AI, startup, and community signals from public RSS sources, Bluesky search, and Hacker News by default.

Optional social sources:

- `COMMUNITY_LINKEDIN_FEEDS`: comma-separated RSS/API bridge URLs for approved LinkedIn sources.
- `COMMUNITY_X_FEEDS`: comma-separated RSS/API bridge URLs for approved X/Twitter sources.
- `COMMUNITY_YOUTUBE_FEEDS`: comma-separated YouTube RSS feed URLs.
- `COMMUNITY_PRODUCT_HUNT_FEEDS`: comma-separated Product Hunt or product-launch RSS/API bridge URLs.
- `COMMUNITY_REDDIT_BEARER_TOKEN`: optional Reddit OAuth bearer token for Reddit JSON endpoints when public Reddit access returns 403.

Use official APIs or consented/approved bridge feeds. Do not scrape LinkedIn or X pages directly.
