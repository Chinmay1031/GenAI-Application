# GenAI App

A small ChatGPT-style web app I put together as a portfolio project. It's a
FastAPI backend that talks to OpenAI's `gpt-4o-mini`, and a React (Vite)
frontend styled roughly after the Copilot / Claude chat UIs — sidebar, chat
history, hero screen with suggestion chips, the usual.

Nothing groundbreaking here — the point was to get comfortable wiring a real
LLM into a real UI end-to-end, and to have something I can keep extending.

## What it does

- Regular back-and-forth chat with conversation history
- Streaming replies — text appears token-by-token as the model writes it,
  same feel as ChatGPT / Claude
- Image upload — attach a picture and ask questions about it (uses the vision
  side of `gpt-4o-mini`)
- Markdown rendering in assistant replies, tables and all (`react-markdown` +
  `remark-gfm`)
- Sidebar with your past chats, click to jump back in
- Asks for your name on load and greets you on the hero screen. The name
  isn't persisted, so it re-asks after every reload — kept it that way on
  purpose, felt weird for a demo app to "remember" you forever
- Chats *are* persisted in `localStorage`, so refreshing doesn't nuke your
  history

## Stack

**Backend** — FastAPI, `openai` Python SDK, `python-dotenv`,
`python-multipart` for image uploads. Runs on `127.0.0.1:8000`.

**Frontend** — React 19 + Vite, `axios` for requests, `react-markdown` +
`remark-gfm` for rendering. Runs on `localhost:5173`.

The backend has CORS pinned to the Vite dev origin, so if you change either
port you'll want to update the other side too.

## Running it locally

You'll need Python 3.10+ and Node 18+.

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file at the repo root (one level up from `backend/`) with:

```
OPENAI_API_KEY=sk-...
```

Then start the server:

```bash
uvicorn main:app --reload
```

You should see it at http://127.0.0.1:8000 — hitting `/` returns
`{"message": "Backend is running!"}`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Enter a name, and you're in.

## Project layout

```
.
├── backend/
│   ├── main.py             # FastAPI app, /chat and /chat-with-image
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Almost everything lives here — sidebar, hero,
│   │   │                   # composer, chat area, name prompt
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── .env                    # gitignored — put your OPENAI_API_KEY here
└── .gitignore
```

Yes, I know the repo directory is called "Go Projects" — it's a leftover from
what I originally thought I'd build in here. Ignore that.

## API

Two endpoints, both POST:

**`/chat`** — JSON body

```json
{
  "prompt": "hello",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

**`/chat-with-image`** — `multipart/form-data` with `prompt`, `image`, and
`history` (JSON-encoded string, since multipart can't carry raw JSON).

Both return a `text/plain` stream of the assistant's reply — chunks of raw
text as OpenAI produces them. The frontend reads the stream with
`response.body.getReader()` and appends each chunk to the assistant bubble
as it arrives.

History is sent from the frontend on every request — the backend is
stateless, which keeps things simple and lets the sidebar own the notion of
"which conversation is this."

## Notes and rough edges

- Model is hardcoded to `gpt-4o-mini` in `backend/main.py`. Easy to swap, but
  I haven't wired it up as a setting yet.
- Markdown mid-stream can look briefly odd — a half-written code fence, an
  unclosed `**bold`. It settles the moment the stream finishes.
- Chats live in `localStorage` only. No backend persistence, no accounts.
- The `Smart` dropdown in the composer toolbar is a placeholder — doesn't
  do anything yet.
- Voice button is decorative for now.

## What's next (roughly)

- Model picker
- Delete / rename chats from the sidebar
- Stop button to cancel a streaming reply mid-flight
- Probably a proper user record on the backend once I add auth

---

Built by [Chinmay Bandekar](mailto:chinmay.bandekar@plattner.com).
