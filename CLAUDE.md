# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Repository layout

Monorepo with three top-level apps, no workspace manager (each has its own `package.json` and `node_modules`):

- `/` — Next.js 16 frontend (App Router, React 19, Tailwind v4). Entry: `app/page.tsx`.
- `/api` — NestJS 11 backend. SQLite via Prisma 7 (better-sqlite3 adapter). Talks to Gemini and Telegram.
- `/mcp-server` — Standalone MCP server (stdio transport). Run via `npm run mcp` from root.

## Commands

### Frontend (run from repo root)
- `npm run dev` — Next.js dev server on `:3000`
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint
- `npm run mcp` — run MCP server (`tsx mcp-server/index.ts`)

### API (run from `api/`)
- `npm run start:dev` — Nest watch mode on `:3001` (CORS allows `localhost:3000`)
- `npm run start:prod` — production (`node dist/main`)
- `npm run test` — Jest unit tests
- `npm run test:e2e` — e2e tests (`test/jest-e2e.json`)
- `npm run test -- path/to/file.spec.ts` — single test file
- `npx prisma generate` — regenerate client after schema change
- `npx prisma migrate dev` — create/apply migration + regen client

## Environment

Backend reads env via `dotenv.config()` in `api/src/app.module.ts`. Required in `api/.env`:

- `DATABASE_URL="file:./dev.db"` — read by `prisma.config.ts` (CLI only)
- `GEMINI_API_KEY` — Gemini 2.5 Flash
- `TELEGRAM_BOT_TOKEN` — optional, defaults to `'DUMMY'` string (Telegraf still initializes but bot won't connect)

Note: runtime DB path is hardcoded in `api/src/prisma/prisma.service.ts:11` (`process.cwd() + 'dev.db'`), so the API process must run from `api/`. `DATABASE_URL` is only used by the Prisma CLI.

Frontend currently has no env vars and doesn't yet call the API.

## API architecture (NestJS)

`AppModule` (`api/src/app.module.ts`) wires three feature areas:

1. **`TransactionsModule`** — REST CRUD at `/transactions` (GET, POST, DELETE `:id`, GET `/summary`). Persisted via `PrismaService` against single `Transaction` model (`prisma/schema.prisma`). `getSummary()` computes `income - expense` in-process (not SQL).

2. **`AiModule`** — `AiService` wraps Gemini SDK. Two methods, both force `responseMimeType: "application/json"`:
   - `analyzeReceipt(base64Image)` — multimodal, extracts `{amount, description, type:"expense"}` from receipt photo.
   - `parseTextQuery(text)` — text-only, returns `{amount, description, type:"income"|"expense"}`.

3. **`TelegramUpdate`** (registered as a provider, uses `nestjs-telegraf`) — bot handlers in `api/src/telegram/telegram.update.ts`:
   - `/start`, `/saldo`, `/topup <amount>` commands.
   - `@On('text')` → `aiService.parseTextQuery` → `transactionsService.create`.
   - `@On('photo')` → downloads via Telegram file link → base64 → `aiService.analyzeReceipt` → create transaction.
   - AI calls run in a fire-and-forget IIFE so Telegraf's 90s handler timeout doesn't trip; the user-facing loading message is edited in-place when the work finishes. Preserve this pattern when adding new slow handlers.

`PrismaService` is module-scoped to whichever module imports it (currently `TransactionsModule`). It uses the better-sqlite3 adapter directly with a hardcoded `dev.db` path and exposes only `.transaction` — extend the getter when adding models.

Comments and Telegram replies are in Indonesian; some still reference "LLaVa"/"Ollama" but the implementation actually calls Gemini. Match the existing language when editing.

## Frontend architecture

Boilerplate Next.js App Router (`app/layout.tsx` + `app/page.tsx` only). No API client, state library, or routes beyond the home page yet — anything you build is greenfield. Heed the `AGENTS.md` warning: Next.js 16 has breaking changes vs. older training data — consult `node_modules/next/dist/docs/` before assuming an API exists.

## MCP server

Single-file stdio server in `mcp-server/index.ts`. Currently exposes one tool (`get_server_time`). Independent from `api/` — not connected to transactions or Gemini.
