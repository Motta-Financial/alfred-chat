# alfred-chat UI components

## Logo asset

`public/images/alfred-logo.png` is currently a 1×1 transparent placeholder.

Copy the real logo from the Hub repo before deploying:

```bash
cp ../v0-motta-hub/public/images/alfred-logo.png public/images/alfred-logo.png
```

Or update the `src` prop in `app/layout.tsx` and `app/login/page.tsx` to point to
wherever the asset lives in production (CDN URL, etc.).

## Components

| File | Purpose |
|---|---|
| `AlfredChat.tsx` | Main chat UI. Uses `@ai-sdk/react useChat` with `DefaultChatTransport` to stream from Hub `/api/alfred/chat`. Handles `data-conversation` parts to track the conversation ID. |
| `ConversationSidebar.tsx` | Lists past conversations fetched from Hub `/api/alfred/conversations`. Clicking a row hydrates useChat with historical messages. |
| `HealthDot.tsx` | Pings Hub `/api/alfred/health` every 60 s and shows a green/red dot in the header. |
