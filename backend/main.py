from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

from backend.analysis import analyze_market
from backend.correlation import correlation_edge_report
from backend.devig import DevigMethod
from backend.models import AnalysisResult, ParlayRequest, ParlayResult
from backend.odds_provider import MockOddsProvider

app = FastAPI(title="Sportsbook Edge Finder")

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
    user_prob: Optional[float] = None,
    kelly_multiplier: str = "quarter",
    bankroll: float = 1000.0,
):
    if user_prob is not None and not (0 <= user_prob <= 1):
        raise HTTPException(status_code=422, detail="user_prob must be between 0 and 1")
    if kelly_multiplier not in ("quarter", "half", "full"):
        raise HTTPException(status_code=422, detail="kelly_multiplier must be quarter, half, or full")

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
        user_true_prob_override=user_prob,
        kelly_multiplier=kelly_multiplier,
        bankroll=bankroll,
    )


@app.post("/api/parlay/correlated", response_model=ParlayResult)
def post_parlay(req: ParlayRequest):
    return correlation_edge_report(req.p1, req.p2, req.rho, req.parlay_decimal_odds)


app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
