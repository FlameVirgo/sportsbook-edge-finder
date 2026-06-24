from typing import Optional

from pydantic import BaseModel, Field

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


class ParlayRequest(BaseModel):
    p1: float = Field(ge=0, le=1)
    p2: float = Field(ge=0, le=1)
    rho: float = Field(ge=-1, le=1)
    parlay_decimal_odds: float = Field(gt=1)


class ParlayResult(BaseModel):
    independent_prob: float
    correlated_prob: float
    structural_edge: float
    platform_implied_prob: float
    ev_naive_independent: float
    ev_correlated: float


__all__ = ["BookRow", "AnalysisResult", "ParlayRequest", "ParlayResult", "DevigMethod"]
