# Telegram Mini App (React)

This project is a React-based Telegram Mini App that also runs standalone in the
browser. When embedded in Telegram, it uses `initData` for authentication. When
running standalone, it can use the Telegram Login Widget.

## Quick Start

1. Install dependencies:
   - `npm install`
2. Update config:
   - Edit `telegram-miniapp.config.js`
   - Copy `env.sample` to `.env` and adjust values (never commit `.env`)
3. Run locally:
   - `npm run dev`

## Telegram Auth Notes

- **Mini App**: The WebApp `initData` is the auth payload. Validate it on your
  backend for secure authentication.
- **Standalone**: The login widget requires a backend endpoint (`authUrl`) to
  validate the Telegram login data and set a session.
- **Bot token**: Store it in `.env` as `TELEGRAM_BOT_TOKEN`. It is only for
  server-side verification and must never be exposed in frontend code.

## Key Files

- `telegram-miniapp.config.js`: Base configuration for the mini app.
- `src/telegram/telegramConfig.js`: Config wrapper with env overrides.
- `src/telegram/auth.js`: Telegram auth payload helpers.
- `src/components/TelegramLoginWidget.jsx`: Standalone login widget.
