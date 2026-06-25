# Sportsbook Edge Finder

Pick a side on a live game, and this tool compares that bet's odds across sportsbooks, de-vigs the sharpest book's line to recover a true probability estimate, and ranks the other books by expected value (EV) and Kelly-optimal stake size — surfacing whichever book offers the bettor the most edge.

## Stack

- Backend: Python, FastAPI
- Frontend: plain HTML/CSS/vanilla JS — no build step, no framework
- Data: live odds only, via [The Odds API](https://the-odds-api.com) (`backend/live_odds_provider.py`), behind an `OddsProvider` interface (`backend/odds_provider.py`) so another live provider could be swapped in later

## Running locally

This app requires a live odds API key — there's no mock-data fallback.

```bash
cp .env.example .env
# edit .env and set ODDS_API_KEY=<your key>

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Open `http://localhost:8000`. `.env` is git-ignored — never commit your key. The server raises a clear error on startup if `ODDS_API_KEY` is missing.

`ODDS_API_SPORTS` (comma-separated sport keys, default `americanfootball_nfl,basketball_nba,soccer_epl`) controls which sports are pulled. Live integration is scoped to moneyline (`h2h`) markets only — spreads/totals quote different point lines per book, which breaks the "same outcomes across books" comparison the analysis relies on. Events are fetched once per process; restart the server to refresh.

## UI

Pick a sport tab, then tap a side's odds button on a game card (the displayed price is Pinnacle's, the sharp reference). That immediately runs the analysis and shows a "Bet $X on Book" recommendation plus the full per-book breakdown.

## How it works

1. **Odds → implied probability**: American odds converted to implied probability (`backend/odds_math.py`)
2. **De-vig**: the sharp reference book's line (flagged `is_sharp`, Pinnacle) is de-vigged using the multiplicative method to recover a fair probability (`backend/devig.py`)
3. **EV**: `EV = p_true * decimal_odds - 1` for every other (soft) book on the same market (`backend/kelly.py`)
4. **Kelly sizing**: full Kelly fraction `(p*d - 1) / (d - 1)` and a recommended stake in dollars given your bankroll

The orchestration logic lives in `backend/analysis.py`.

## API

- `GET /api/events` — live games/markets/outcomes for the UI
- `GET /api/analyze` — per-book EV/edge/Kelly table for a selected event/market/outcome

## Scope notes

- De-vig method: multiplicative only for now. Power and Shin's method are intentionally left as a strategy slot (`DevigMethod` enum in `backend/devig.py`) for later.
- Odds data: live moneyline only — no spreads, totals, or player props yet (different point lines per book and a separate per-event API endpoint, respectively).
- Single-leg bets only — no multi-leg parlay/correlation modeling.

See `PLAN.md` for the original design plan.
