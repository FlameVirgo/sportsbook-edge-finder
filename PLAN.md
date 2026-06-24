# Sportsbook Edge Finder — Implementation Plan

## Context

The user wants a prototype tool that implements the classic sports-betting "find the soft line" workflow: a user picks a specific bet (e.g. "Vinicius Jr. shots on target, Brazil vs Scotland"), and the service compares that market's odds across multiple sportsbooks, de-vigs the sharpest book's line to recover a true probability estimate, and ranks the other books by expected value (EV) and Kelly-optimal stake size — surfacing whichever book offers the bettor the most edge.

This is a brand-new, empty project directory — there is no existing code to integrate with. Scope was narrowed with the user via clarifying questions:
- **Data**: mock/sample odds data only for this build, but behind a clean provider interface so a real odds API can be swapped in later without touching the math layer.
- **Interaction model**: on-demand single-bet lookup (user selects event → market → outcome), not a continuous background scanner.
- **De-vig method**: multiplicative (normalization) only. Power method and Shin's method are explicitly out of scope, but the code should leave a strategy slot so they can be added later without refactoring callers.
- **DFS correlation layer**: a basic 2-leg correlated-parlay calculator (user manually supplies a correlation estimate rho), not full copula/Monte Carlo modeling.
- **Stack**: backend in Python (FastAPI), frontend in plain HTML/CSS/vanilla JS — no build step, no framework, no database.

## Project Structure

Created directly under the project root (currently empty):

```
backend/
├── __init__.py
├── main.py            # FastAPI app, routes, static file mount for frontend
├── models.py          # Pydantic request/response schemas
├── mock_data.py        # Mock events/markets/books (incl. Vinicius Jr. example)
├── odds_provider.py    # OddsProvider ABC + MockOddsProvider
├── odds_math.py        # American<->decimal conversion, implied probability
├── devig.py             # Multiplicative devig + strategy enum slot for future methods
├── kelly.py             # EV, edge, full/fractional Kelly
├── correlation.py      # 2-leg correlated parlay math
└── analysis.py          # Orchestrates odds_provider + devig + kelly into one result
frontend/
├── index.html
├── style.css
└── app.js
requirements.txt
```

## Backend Modules

**`odds_math.py`** — pure conversion functions:
- `american_to_decimal(american) -> float`
- `decimal_to_american(decimal) -> float`
- `implied_prob_from_decimal(decimal) -> float` (= `1/d`)
- `implied_prob_from_american(american) -> float` (implemented via `american_to_decimal` then `implied_prob_from_decimal` — algebraically identical to the spec's piecewise `O/(O+100)` / `100/(O+100)` formulas, but avoids duplicating the conversion logic)

**`devig.py`**:
- `DevigMethod` enum with `MULTIPLICATIVE` (only implemented value; `POWER`/`SHIN` left commented as future slots)
- `multiplicative_devig(implied_probs: list[float]) -> list[float]` — `p_i_fair = q_i / sum(q_j)`
- `devig(implied_probs, method=DevigMethod.MULTIPLICATIVE)` — dispatcher; raises `NotImplementedError` for unimplemented methods, so adding power/Shin later is a new branch, not a refactor

**`kelly.py`**:
- `ev_per_unit(p_true, decimal_odds) -> float` = `p*d - 1`
- `full_kelly_fraction(p_true, decimal_odds) -> float` = `(p*d - 1) / (d - 1)`, clamped to `>= 0` for staking purposes (negative Kelly = no bet; the raw negative EV/edge is still shown elsewhere so a -EV book isn't hidden, just not given a stake)
- `KELLY_MULTIPLIERS = {"quarter": 0.25, "half": 0.5, "full": 1.0}`
- `fractional_kelly_stake(full_kelly_pct, multiplier, bankroll) -> float`

**`correlation.py`**:
- `joint_prob_independent(p1, p2) -> float` = `p1*p2`
- `joint_prob_correlated(p1, p2, rho) -> float` = `p1*p2 + rho*sqrt(p1*(1-p1)*p2*(1-p2))`, clamped to `[0, min(p1,p2)]`
- `correlation_edge_report(p1, p2, rho, parlay_decimal_odds) -> dict` returning independent prob, correlated prob, structural edge (the gap the platform isn't pricing), and EV at the platform's posted parlay price under each assumption

**`odds_provider.py`**:
- `OddsProvider` ABC with `list_events()` and `get_market(event_id, market_id)`
- `MockOddsProvider(OddsProvider)` reading from `mock_data.py` — this is the swap point for a future real-API provider (e.g. `TheOddsAPIProvider`), which would implement the same two methods; `main.py` only needs to change which provider it instantiates.

**`mock_data.py`** — 3 mock events, each with 1 sharp book (`is_sharp: True`, e.g. "Pinnacle") and 3-4 soft books:
1. **Brazil vs Scotland** — includes `Vinicius Jr. - Shots on Target Over 0.5` (player prop) and a 3-way moneyline market
2. **Lakers vs Celtics** — `LeBron James - Points Over 25.5` (player prop)
3. **Chiefs vs Bills** — a point-spread market

At least one soft book per market priced at standard `-110/-110` so the demo visibly shows ~4.5% vig being stripped out during de-vig — useful for manual verification.

**`analysis.py`** — orchestrator, where the "don't de-vig a book against itself" rule is enforced:
- `analyze_market(event_id, market_id, selected_outcome, devig_method=MULTIPLICATIVE, user_true_prob_override=None, kelly_multiplier="quarter", bankroll=1000)`
- Finds the sharp book, de-vigs its line to get `p_true` (unless the user supplies `user_true_prob_override`, which short-circuits the devig entirely — since de-vigging the sharp book only recovers its own opinion, not genuine edge against it)
- For every other (non-sharp) book: converts odds, computes EV/edge/full Kelly/fractional stake against `p_true`
- Sorts rows by edge descending; returns `best_book`, `p_true`, `p_true_source` (`"sharp_reference:<book>"` or `"user_override"`), and all rows — including negative-EV books, not filtered out, so the user can see which books to avoid too

## API Endpoints (`main.py`)

- **`GET /api/events`** — list of events/markets/outcomes for populating the UI dropdowns
- **`GET /api/analyze`** — query params `event_id`, `market_id`, `outcome`, `devig_method` (default `multiplicative`), `user_prob` (optional, 0-1), `kelly_multiplier` (`quarter`/`half`/`full`), `bankroll`. Returns sharp book reference, `p_true` + its source, and the ranked per-book table (book, american/decimal odds, implied prob, EV, edge, full Kelly %, recommended stake $)
- **`POST /api/parlay/correlated`** — body `{p1, p2, rho, parlay_decimal_odds}` (Pydantic-validated `rho ∈ [-1,1]`, `p1/p2 ∈ [0,1]`). Returns independent vs correlated joint probability, structural edge, and EV under each assumption
- `app.mount("/", StaticFiles(directory="frontend", html=True))` serves the frontend with zero build step

## Frontend

**`index.html`** — single page, three sections:
1. Selector panel: cascading `<select>`s for event → market → outcome, optional "your probability estimate" override input, Kelly multiplier dropdown, bankroll input, "Find Best Edge" button
2. Results panel: a banner showing which book is the sharp reference and the derived true probability, then a results table (Book | Odds | Implied % | EV | Edge | Full Kelly % | Stake $) with the best-edge row highlighted
3. Parlay calculator panel: two probability inputs, a rho slider (-1 to 1) with live readout, a parlay price input, and a comparison table (independent vs correlated probability/EV)

**`app.js`** — `loadEvents()`, `onEventChange()`/`onMarketChange()` (cascading dropdowns from a cached events response), `runAnalysis()` (calls `/api/analyze`, renders + sorts results, highlights best row), `runParlayCalc()` (calls `/api/parlay/correlated`, renders comparison). Plain `fetch()`, no bundler.

**`style.css`** — minimal layout for the two panels, a highlight class for the best-edge row, basic table/slider styling.

## Running Locally

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install fastapi "uvicorn[standard]"
uvicorn backend.main:app --reload --port 8000
# open http://localhost:8000
```

## Verification

1. **Hand-check against the spec's worked example**: Team A -150 / B +130 → multiplicative devig gives `fair_A = 0.580`; override `user_prob=0.62` on a -150 book → EV should compute to `+3.3%`, full Kelly to `~5.0%`. Run this exact case through `/api/analyze` with `user_prob=0.62` and confirm the numbers match.
2. **Vig-stripping check on mock data**: for the Vinicius Jr. market, Pinnacle at -135/+115 → implied probs sum to ~1.04 → devigged "Over 0.5" should land around 55%; a soft book at -110/-110 should show a visibly different (less accurate) implied probability, confirming the sharp line is tighter.
3. **Endpoint behavior**: `/api/analyze` excludes the sharp book from `rows`, sorts by edge descending, includes negative-EV books with `full_kelly_pct` clamped to 0 (not hidden); `user_prob` set bypasses devig entirely (`p_true_source == "user_override"`).
4. **Correlation edge cases**: `rho=0` → correlated prob equals independent prob exactly; `rho=1` → correlated prob equals `min(p1,p2)`; `rho=-1` → clamps at 0 rather than going negative.
5. **Validation**: `user_prob=1.5` or `rho=2.0` should return HTTP 422 automatically via Pydantic field constraints.
6. Start the server, open the page in a browser, and manually run the Vinicius Jr. example end-to-end through the UI to confirm the best-edge book is correctly highlighted.
