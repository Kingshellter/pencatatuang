# pencatatuang

Money recorder app. Next.js frontend + NestJS API (Prisma + SQLite) with Gemini AI and optional Telegram bot.

## Structure

- `/` — Next.js 16 frontend (App Router)
- `/api` — NestJS backend
- `/mcp-server` — MCP server

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
# frontend
npm install

# api
cd api
npm install
cp .env.example .env   # then fill in keys
npx prisma generate
npx prisma migrate dev
```

## Env vars (api/.env)

```
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your_gemini_key"
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
```

- Gemini key: https://aistudio.google.com/apikey
- Telegram token optional (falls back to `DUMMY` if absent)

## Run

```bash
# frontend — http://localhost:3000
npm run dev

# api — http://localhost:3001
cd api && npm run start:dev
```

API CORS allows `http://localhost:3000`.

## Scripts

Frontend (root):
- `npm run dev` — Next.js dev server
- `npm run build` — production build
- `npm run start` — start built app
- `npm run lint` — ESLint
- `npm run mcp` — run MCP server

API (`api/`):
- `npm run start:dev` — watch mode
- `npm run start:prod` — production
- `npm run test` — Jest
- `npm run test:e2e` — e2e tests
