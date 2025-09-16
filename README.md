# telegram-relay (Vercel Serverless)

Minimal serverless endpoint to relay contact form messages to Telegram.

## Endpoint

- `POST /api/send-telegram`
- Body (JSON):
  ```json
  { "name": "John", "email": "john@example.com", "message": "Hi" }
  ```
- Responses:
  - 200 `{ ok: true }`
  - 400 `{ ok: false, error: "invalid_payload" }`
  - 405 `{ ok: false, error: "method_not_allowed" }`
  - 503 `{ ok: false, error: "telegram_not_configured" }`
  - 502/500 for upstream/fetch failures

## Environment variables (Vercel Project Settings)

- `TELEGRAM_BOT_TOKEN` — bot token from @BotFather
- `TELEGRAM_CHAT_ID` — your chat id
- `ALLOWED_ORIGINS` — comma-separated allowed origins for CORS
  - Example: `http://localhost:5173, https://your-portfolio-domain`
  - Use `*` to allow all (not recommended)

## CORS

Preflight `OPTIONS` is supported. Response includes `Access-Control-Allow-Origin` based on `ALLOWED_ORIGINS`.

## Deploy on Vercel

1. Create a new GitHub repo and push these files.
2. Import the repo in Vercel (New Project).
3. Add the env vars above, then Deploy.
4. Your endpoint: `https://<project>.vercel.app/api/send-telegram`.

## Notes

- Uses Node.js 20 runtime (configured inside the function via `exports.config`).
- No dependencies required.
- Keep your bot token secret; do not commit it.
