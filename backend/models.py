from typing import Optional

from pydantic import BaseModel

from backend.devig import DevigMethod


class BookRow(BaseModel):
    book: str
    american_odds: float
    decimal_odds: float
    implied_prob: float
    ev: float
    edge: float
    full_kelly_pct: float
    recommended_stake: float


class AnalysisResult(BaseModel):
    sharp_book: str
    p_true: float
    p_true_source: str
    selected_outcome: str
    best_book: Optional[str]
    rows: list[BookRow]


class ArbitrageOutcome(BaseModel):
    outcome: str
    book: str
    american_odds: float
    decimal_odds: float
    implied_prob: float
    stake: float


class ArbitrageOpportunity(BaseModel):
    event_id: str
    event_label: str
    sport: str
    market_id: str
    market_label: str
    outcomes: list[ArbitrageOutcome]
    total_implied_prob: float
    profit_pct: float
    profit_amount: float


__all__ = ["BookRow", "AnalysisResult", "DevigMethod", "ArbitrageOutcome", "ArbitrageOpportunity"]
