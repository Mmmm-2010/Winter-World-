# Winter World 2027 — AI Companion setup

## Requirements
- Node.js 20+
- An OpenAI API key with API billing/usage enabled

## Setup
1. In the project folder run `npm install`.
2. Copy `.env.example` to `server/.env` (or keep the root `.env`; dotenv loads it from the project root).
3. Put your API key in `OPENAI_API_KEY=...`. Never paste the key into React files or GitHub.
4. Run `npm run dev:all` to start the API on port 5000 and Vite on port 5173.
5. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

You can also run `npm run server` and `npm run dev` in two separate terminals.

## API
- `GET /api/health` — health check
- `POST /api/companion/chat` — sends a chat message to the AI

The Vite development server proxies `/api` requests to `http://localhost:5000`.
