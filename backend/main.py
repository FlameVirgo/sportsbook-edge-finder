import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

from backend.analysis import analyze_market, find_arbitrage_opportunities
from backend.devig import DevigMethod
from backend.live_odds_provider import TheOddsApiProvider
from backend.models import AnalysisResult, ArbitrageOpportunity
from backend.odds_provider import CompositeOddsProvider, MockOddsProvider

load_dotenv()

app = FastAPI(title="Sportsbook Edge Finder")

_api_key = os.environ.get("ODDS_API_KEY")
if _api_key:
    _sports = os.environ.get("ODDS_API_SPORTS", "americanfootball_nfl,basketball_nba,soccer_epl").split(",")
    provider = CompositeOddsProvider(MockOddsProvider(), TheOddsApiProvider(_api_key, _sports))
else:
    provider = MockOddsProvider()


@app.get("/api/events")
def get_events():
    return provider.list_events()


@app.get("/api/analyze", response_model=AnalysisResult)
def get_analysis(
    event_id: str,
    market_id: str,
    outcome: str,
    devig_method: DevigMethod = DevigMethod.MULTIPLICATIVE,
    bankroll: float = 1000.0,
):
    try:
        market = provider.get_market(event_id, market_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="event or market not found")

    if outcome not in market["outcomes"]:
        raise HTTPException(status_code=422, detail=f"outcome must be one of {market['outcomes']}")

    return analyze_market(
        event_id=event_id,
        market_id=market_id,
        selected_outcome=outcome,
        provider=provider,
        devig_method=devig_method,
        bankroll=bankroll,
    )


@app.get("/api/arbitrage", response_model=list[ArbitrageOpportunity])
def get_arbitrage(bankroll: float = 1000.0):
    return find_arbitrage_opportunities(provider, bankroll)


app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
