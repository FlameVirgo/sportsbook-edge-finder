# Sportsbook Edge Finder

Pick a specific bet (e.g. "Vinicius Jr. shots on target, Brazil vs Scotland"), and this tool compares that market's odds across sportsbooks, de-vigs the sharpest book's line to recover a true probability estimate, and ranks the other books by expected value (EV) and Kelly-optimal stake size — surfacing whichever book offers the bettor the most edge.

## Stack

- Backend: Python, FastAPI
- Frontend: plain HTML/CSS/vanilla JS — no build step, no framework
- Data: mock odds data behind a swappable `OddsProvider` interface (see `backend/odds_provider.py`), plus an optional live provider backed by [The Odds API](https://the-odds-api.com)

## Running locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Open `http://localhost:8000`.

### Live odds (optional)

By default the app runs entirely on mock data. To pull real moneyline odds from The Odds API alongside the mock player-prop demos:

```bash
cp .env.example .env
# edit .env and set ODDS_API_KEY=<your key>
```

`.env` is git-ignored — never commit your key. With `ODDS_API_KEY` set, `/api/events` returns the mock demo events plus live events (prefixed `live_`) for the sports listed in `ODDS_API_SPORTS`. Live integration is scoped to moneyline (`h2h`) markets only — spreads/totals quote different point lines per book, which breaks the "same outcomes across books" comparison the analysis relies on. Player props remain mock-only since they require The Odds API's separate per-event endpoint and aren't available on all plans. Events are fetched once per process; restart the server to refresh live odds.

## How it works

1. **Odds → implied probability**: American or decimal odds converted to implied probability (`backend/odds_math.py`)
2. **De-vig**: the sharp reference book's line (flagged `is_sharp` in `backend/mock_data.py`, e.g. Pinnacle) is de-vigged using the multiplicative method to recover a fair probability (`backend/devig.py`)
3. **EV**: `EV = p_true * decimal_odds - 1` for every other (soft) book on the same market (`backend/kelly.py`)
4. **Kelly sizing**: full Kelly fraction `(p*d - 1) / (d - 1)` and a recommended stake in dollars given your bankroll

The orchestration logic lives in `backend/analysis.py`.

## API

- `GET /api/events` — events/markets/outcomes for the UI dropdowns
- `GET /api/analyze` — per-book EV/edge/Kelly table for a selected event/market/outcome

## Scope notes

- De-vig method: multiplicative only for now. Power and Shin's method are intentionally left as a strategy slot (`DevigMethod` enum in `backend/devig.py`) for later.
- Odds data: live moneyline odds via The Odds API (optional, see above) merged with mock player-prop/spread demos; spreads/totals and player props are not yet live.
- Single-leg bets only — no multi-leg parlay/correlation modeling.

See `PLAN.md` for the original design plan.
