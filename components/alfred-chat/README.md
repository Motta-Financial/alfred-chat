# alfred-chat UI components

Self-contained demo UI. All data is fictional and lives in `lib/demo/mock-data.ts`;
nothing here talks to a backend or reads environment variables.

## Components

| File | Purpose |
|---|---|
| `ChatPage.tsx` | Page shell. Holds conversations, projects and messages in React state, seeded from the mock data. |
| `AlfredChat.tsx` | Chat UI. Replies are scripted (keyword matched) after a short simulated delay. |
| `ConversationSidebar.tsx` | Lists past and new conversations. Clicking a row loads its pre-written messages. |
| `ProjectView.tsx` / `ProjectDialog.tsx` | Create, edit and delete projects in local state. Client search covers the mock clients only. |
| `ModelSelector.tsx` | Static model list; selecting an option changes nothing. |
| `HealthDot.tsx` | Always shows a green "Connected" indicator. |
