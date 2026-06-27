import logging
import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from backend.analysis import analyze_market, find_arbitrage_opportunities
from backend.auth import auth_router, require_active_subscription
from backend.db import init_db
from backend.db_models import User
from backend.devig import DevigMethod
from backend.live_odds_provider import TheOddsApiProvider
from backend.models import AnalysisResult, ArbitrageOpportunity
from backend.rate_limit import limiter
from backend.routers.bets import bets_router
from backend.routers.billing import billing_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

load_dotenv()

app = FastAPI(title="Sportsbook Edge Finder")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

init_db()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        # Harmless if the connection is plain HTTP (e.g. local dev); only
        # enforced by browsers once served over HTTPS, which is expected in
        # production (see README's "Before deploying publicly").
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# Comma-separated list of allowed cross-origin domains, e.g. if the frontend
# is ever deployed separately from this backend. Empty by default — same
# behavior as today (frontend+backend are one app, so no CORS is needed).
_allowed_origins = [o for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o]
if _allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_allowed_origins,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["*"],
    )

_api_key = os.environ.get("ODDS_API_KEY")
if not _api_key:
    raise RuntimeError(
        "ODDS_API_KEY is not set. This app requires a live odds API key — "
        "copy .env.example to .env and set ODDS_API_KEY=<your key>."
    )
_sports = os.environ.get("ODDS_API_SPORTS", "americanfootball_nfl,soccer_fifa_world_cup").split(",")
provider = TheOddsApiProvider(_api_key, _sports)

app.include_router(auth_router)
app.include_router(bets_router)
app.include_router(billing_router)


@app.get("/api/events")
@limiter.limit("60/minute")
def get_events(request: Request):
    return provider.list_events()


@app.get("/api/analyze", response_model=AnalysisResult)
@limiter.limit("30/minute")
def get_analysis(
    request: Request,
    event_id: str,
    market_id: str,
    outcome: str,
    devig_method: DevigMethod = DevigMethod.MULTIPLICATIVE,
    bankroll: float = Query(default=1000.0, gt=0, le=10_000_000),
    _user: User = Depends(require_active_subscription),
):
    try:
        market = provider.get_market(event_id, market_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="event or market not found")

    if outcome not in market["outcomes"]:
        raise HTTPException(status_code=422, detail=f"outcome must be one of {market['outcomes']}")

    try:
        return analyze_market(
            event_id=event_id,
            market_id=market_id,
            selected_outcome=outcome,
            provider=provider,
            devig_method=devig_method,
            bankroll=bankroll,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.get("/api/arbitrage", response_model=list[ArbitrageOpportunity])
@limiter.limit("30/minute")
def get_arbitrage(
    request: Request,
    bankroll: float = Query(default=1000.0, gt=0, le=10_000_000),
    sport: Optional[str] = None,
    _user: User = Depends(require_active_subscription),
):
    opportunities = find_arbitrage_opportunities(provider, bankroll)
    if sport:
        opportunities = [o for o in opportunities if o.sport == sport]
    return opportunities


_dist_dir = "frontend/dist"
if os.path.isdir(_dist_dir):
    app.mount("/", StaticFiles(directory=_dist_dir, html=True), name="frontend")
# else: no built frontend yet — run `npm run dev` in frontend/ for local
# development (it proxies /api/* to this server, see frontend/vite.config.ts)
