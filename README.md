# Eve

Eve is a browser chat that keeps your conversations after a refresh and turns “Plan 3 days in Lisbon” into a day-by-day plan on the screen.

Notion, Linear, and Sentry are not connected. Weather answers are sample data, not a live forecast. There is no public URL yet: this app is not deployed.

## Run

```bash
npm install
npm run dev
```

The dev server listens on port 8080.

Chats, memory, and trip plans are stored in the browser (`localStorage`). There is no account or payment flow in this app.
