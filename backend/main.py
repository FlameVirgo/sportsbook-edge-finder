import logging
import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from backend.analysis import analyze_market, find_arbitrage_opportunities
from backend.devig import DevigMethod
from backend.live_odds_provider import TheOddsApiProvider
from backend.models import AnalysisResult, ArbitrageOpportunity

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

load_dotenv()

app = FastAPI(title="Sportsbook Edge Finder")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Comma-separated list of allowed cross-origin domains, e.g. if the frontend
# is ever deployed separately from this backend. Empty by default — same
# behavior as today (frontend+backend are one app, so no CORS is needed).
_allowed_origins = [o for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o]
if _allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_allowed_origins,
        allow_methods=["GET"],
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
