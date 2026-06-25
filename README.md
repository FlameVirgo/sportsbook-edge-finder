# Sportsbook Edge Finder

Pick a side on a live game, and this tool compares that bet's odds across sportsbooks, de-vigs the sharpest book's line to recover a true probability estimate, and ranks the other books by expected value (EV) and Kelly-optimal stake size — surfacing whichever book offers the bettor the most edge. Also includes an Arbitrage Finder that scans for guaranteed-profit opportunities across books.

## Stack

- Backend: Python, FastAPI
- Frontend: React + TypeScript, built with Vite, styled with Tailwind (config in place for new components) plus CSS Modules for existing ones — see `frontend/src/`
- Data: live odds only, via [The Odds API](https://the-odds-api.com) (`backend/live_odds_provider.py`), behind an `OddsProvider` interface (`backend/odds_provider.py`) so another live provider could be swapped in later

## Running locally

This app requires a live odds API key — there's no mock-data fallback.

```bash
cp .env.example .env
# edit .env and set ODDS_API_KEY=<your key>
```

### Quickest way to run it

```bash
./run.sh
```

Sets up the Python venv, builds the frontend, and starts the server at `http://localhost:8000` — no hot reload, just the simplest single-command way to see the site running.

### Development (hot reload)

Two processes, two terminals:

```bash
# terminal 1 — backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` (Vite's dev server — it proxies `/api/*` to the FastAPI backend on port 8000, see `frontend/vite.config.ts`).

### Production-style (single port)

```bash
cd frontend && npm install && npm run build && cd ..
uvicorn backend.main:app --port 8000
```

Open `http://localhost:8000` — FastAPI serves the built `frontend/dist` directly. If `frontend/dist` doesn't exist yet, the backend just skips mounting it (the API still works; you'd need to also run the Vite dev server for a UI).

`.env` is git-ignored — never commit your key. The server raises a clear error on startup if `ODDS_API_KEY` is missing.

`ODDS_API_SPORTS` (comma-separated sport keys, default `americanfootball_nfl,soccer_fifa_world_cup`) controls which sports are pulled. Live integration is scoped to moneyline (`h2h`) markets only — spreads/totals quote different point lines per book, which breaks the "same outcomes across books" comparison the analysis relies on. Events are fetched once per process; restart the backend to refresh.

## UI

Two tabs:

- **Value Bet Finder** — pick a sport tab, then tap a side's odds button on a game card (the displayed price is Pinnacle's, the sharp reference). That immediately runs the analysis and shows a "Bet $X on Book" recommendation plus the full per-book breakdown.
- **Arbitrage Finder** — pick a sport (NFL / FIFA World Cup) and scan for guaranteed-profit windows across books, with required stake per outcome to lock in the profit.

Frontend structure (`frontend/src/`):

```
api/client.ts          fetch wrappers for /api/events, /api/analyze, /api/arbitrage
lib/format.ts           pure formatting helpers (odds, percentages, kickoff times)
types.ts                shared TypeScript types mirroring backend/models.py
components/             one component per UI piece, each with a co-located .module.css
App.tsx, main.tsx       entry point
```

CSS Modules were used to port the existing look over exactly as-is; Tailwind is configured (`tailwind.config.ts`) and ready for new components going forward.

## How it works

1. **Odds → implied probability**: American odds converted to implied probability (`backend/odds_math.py`)
2. **De-vig**: the sharp reference book's line (flagged `is_sharp`, Pinnacle) is de-vigged using the multiplicative method to recover a fair probability (`backend/devig.py`)
3. **EV**: `EV = p_true * decimal_odds - 1` for every other (soft) book on the same market (`backend/kelly.py`)
4. **Kelly sizing**: full Kelly fraction `(p*d - 1) / (d - 1)` and a recommended stake in dollars given your bankroll
5. **Arbitrage**: for each market, find the best price per outcome across all books; if the implied probabilities sum to under 100%, split stakes proportionally to lock in a guaranteed profit (`backend/analysis.py::find_arbitrage_opportunities`)

The orchestration logic lives in `backend/analysis.py`.

## API

- `GET /api/events` — live games/markets/outcomes for the UI
- `GET /api/analyze` — per-book EV/edge/Kelly table for a selected event/market/outcome
- `GET /api/arbitrage?bankroll=&sport=` — guaranteed-profit opportunities, optionally filtered by sport

## Scope notes

- De-vig method: multiplicative only for now. Power and Shin's method are intentionally left as a strategy slot (`DevigMethod` enum in `backend/devig.py`) for later.
- Odds data: live moneyline only — no spreads, totals, or player props yet (different point lines per book and a separate per-event API endpoint, respectively).
- Single-leg bets only — no multi-leg parlay/correlation modeling.
- No Storybook or component tests yet — the TypeScript + one-component-per-file structure makes both straightforward to add later.

See `PLAN.md` for the original design plan.
