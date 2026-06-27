# Sportsbook Edge Finder

Pick a side on a live game, and this tool compares that bet's odds across sportsbooks, de-vigs the sharpest book's line to recover a true probability estimate, and ranks the other books by expected value (EV) and Kelly-optimal stake size — surfacing whichever book offers the bettor the most edge. Also includes an Arbitrage Finder that scans for guaranteed-profit opportunities across books, user accounts with a personal bet-tracking ledger, and Stripe-subscription gating.

## Stack

- Backend: Python, FastAPI
- Database: SQLite via SQLAlchemy (`backend/db.py`) — users and bet history. `DATABASE_URL` env-overridable for a future Postgres swap.
- Auth: self-built, JWT sessions + bcrypt (`backend/auth.py`), plus optional Google sign-in (Google Identity Services, verified server-side) — no managed auth provider.
- Payments: Stripe subscriptions (test mode), Checkout + Billing Portal hosted flows (`backend/routers/billing.py`)
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

Three tabs (the third only visible when logged in):

- **Value Bet Finder** — pick a sport tab, then tap a side's odds button on a game card (the displayed price is Pinnacle's, the sharp reference). That immediately runs the analysis and shows a "Bet $X on Book" recommendation plus the full per-book breakdown. Requires login + an active subscription.
- **Arbitrage Finder** — pick a sport (NFL / FIFA World Cup) and scan for guaranteed-profit windows across books, with required stake per outcome to lock in the profit. Also requires login + an active subscription.
- **My Bets** — log bets you placed at a real sportsbook (book, odds, stake) and track win rate / net P&L over time. Only requires login, not a subscription.

Account menu (top right): Log In / Sign Up when logged out; an avatar + dropdown (My Bets, Manage Subscription, Log Out) when logged in.

Frontend structure (`frontend/src/`):

```
api/client.ts          fetch wrappers for every /api/* endpoint, incl. auth Bearer header
lib/format.ts           pure formatting helpers (odds, percentages, kickoff times)
lib/logos.ts            team logo / country flag URL lookup
types.ts                shared TypeScript types mirroring backend/models.py
context/AuthContext.tsx  auth state (token, user, login/signup/logout, auth-modal visibility)
hooks/useAuth.ts        useAuth() hook over AuthContext
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

- `GET /api/events` — live games/markets/outcomes for the UI (public)
- `GET /api/analyze` — per-book EV/edge/Kelly table for a selected event/market/outcome (requires login + active subscription)
- `GET /api/arbitrage?bankroll=&sport=` — guaranteed-profit opportunities, optionally filtered by sport (requires login + active subscription)
- `POST /api/auth/{signup,login,google}`, `GET /api/auth/me`
- `GET/POST /api/bets`, `PATCH/DELETE /api/bets/{id}` — personal bet ledger (requires login)
- `POST /api/billing/{create-checkout-session,create-portal-session}`, `POST /api/billing/webhook` (Stripe)

## Security

- `bankroll` is bounded (`0 < bankroll <= 10,000,000`) on `/api/analyze` and `/api/arbitrage`; bad input returns a 422, not a silent garbage result.
- Every endpoint is rate-limited per IP (`slowapi`): 60/min on `/api/events` and the bet-ledger reads, 30/min on `/api/analyze`, `/api/arbitrage`, and bet-ledger writes, 10/min on auth (`signup`/`login`/`google`) and billing (Stripe checkout/portal session creation). This protects both the shared Odds API quota and against credential-stuffing / Stripe-session-spam from one abusive client. The Stripe webhook is intentionally not IP-rate-limited — it's already authenticated via signature verification, and limiting it risks dropping legitimate events under load.
- Login timing is normalized (a dummy bcrypt comparison runs even when the email doesn't exist) so response time can't be used to enumerate registered accounts.
- `JWT_SECRET` must be at least 32 characters — the app refuses to start with a weak signing secret, since that secret is what lets an attacker forge login sessions.
- Google sign-in tokens are verified server-side (signature, audience, issuer, expiry, `email_verified`) before being trusted; the google-auth library's failure modes are mapped to a clean 401 instead of an unhandled 500.
- Baseline security response headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`) are set on every response.
- CORS is off by default (frontend+backend are one app, so same-origin covers it). Set `ALLOWED_ORIGINS` (comma-separated) only if you split frontend and backend across different domains.
- Dependencies are pinned in `requirements.txt`; Dependabot (`.github/dependabot.yml`) and GitHub vulnerability alerts are enabled on this repo for both `pip` and `npm`.

### Accounts & payments setup

Required: `JWT_SECRET` (any long random string) and `DATABASE_URL` (defaults to a local `sqlite:///./app.db` file, gitignored). Stripe is optional for local dev — billing endpoints return a clean 503 until you set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` (create a test-mode Stripe account, a test Product+Price, and use the Stripe CLI — `stripe listen --forward-to localhost:8000/api/billing/webhook` — for local webhook testing). Everything else (signup, login, bet ledger, the subscription gate itself) works fully without Stripe configured.

Google sign-in is also optional. Create an OAuth 2.0 Client ID (type: Web application) at the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), add `http://localhost:5173` and `http://localhost:8000` as authorized JavaScript origins for local dev, and set `GOOGLE_CLIENT_ID` in the backend's `.env` and `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` to the same value (it's a public client ID, not a secret). The `/api/auth/google` endpoint returns a clean 503 and the frontend just hides the Google button until both are set. The backend verifies the Google ID token's signature, audience, and `email_verified` claim before trusting it; a Google sign-in with the same email as an existing password account links to that account rather than creating a duplicate.

### Before deploying publicly

- Set `ODDS_API_KEY` / `ODDS_API_SPORTS` via your host's secret manager — never bake into a committed file or container image.
- Confirm your host terminates HTTPS (Render/Fly/Vercel etc. all do this automatically).
- If frontend and backend end up on different domains, set `ALLOWED_ORIGINS` to the real frontend URL.
- Watch Odds API quota usage after launch — the current plan has a hard monthly cap.
- Per-IP rate limiting (`slowapi`) keys off the client socket's IP. If you put this behind a reverse proxy/load balancer that doesn't forward the real client IP transparently (most PaaS hosts, e.g. Render/Fly, do), every client would share one rate-limit bucket — check your host's docs before launch.

## Scope notes

- De-vig method: multiplicative only for now. Power and Shin's method are intentionally left as a strategy slot (`DevigMethod` enum in `backend/devig.py`) for later.
- Odds data: live moneyline only — no spreads, totals, or player props yet (different point lines per book and a separate per-event API endpoint, respectively).
- Single-leg bets only — no multi-leg parlay/correlation modeling.
- No Storybook or component tests yet — the TypeScript + one-component-per-file structure makes both straightforward to add later.
- No password reset / email verification flow yet for the self-built auth.
