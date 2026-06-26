from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

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


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    subscription_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BetOutcome(str, Enum):
    PENDING = "pending"
    WIN = "win"
    LOSS = "loss"
    PUSH = "push"


class BetCreate(BaseModel):
    sportsbook: str = Field(min_length=1, max_length=100)
    market_description: str = Field(min_length=1, max_length=300)
    american_odds: float
    stake: float = Field(gt=0, le=1_000_000)
    outcome: BetOutcome = BetOutcome.PENDING
    placed_at: datetime
    notes: Optional[str] = Field(default=None, max_length=1000)


class BetUpdate(BaseModel):
    outcome: Optional[BetOutcome] = None
    settled_at: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class BetResponse(BaseModel):
    id: int
    sportsbook: str
    market_description: str
    american_odds: float
    stake: float
    outcome: BetOutcome
    placed_at: datetime
    settled_at: Optional[datetime]
    notes: Optional[str]

    model_config = {"from_attributes": True}


class CheckoutSessionResponse(BaseModel):
    url: str


__all__ = [
    "BookRow", "AnalysisResult", "DevigMethod", "ArbitrageOutcome", "ArbitrageOpportunity",
    "SignupRequest", "LoginRequest", "TokenResponse", "UserResponse",
    "BetOutcome", "BetCreate", "BetUpdate", "BetResponse", "CheckoutSessionResponse",
]
