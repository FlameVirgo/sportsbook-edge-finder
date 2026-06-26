from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.db_models import Bet, User
from backend.models import BetCreate, BetResponse, BetUpdate

bets_router = APIRouter(prefix="/api/bets", tags=["bets"])


def _get_owned_bet(bet_id: int, user: User, db: Session) -> Bet:
    bet = db.get(Bet, bet_id)
    if bet is None or bet.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bet not found")
    return bet


@bets_router.get("", response_model=list[BetResponse])
def list_bets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Bet)
        .filter(Bet.user_id == user.id)
        .order_by(Bet.placed_at.desc())
        .all()
    )


@bets_router.post("", response_model=BetResponse, status_code=201)
def create_bet(
    body: BetCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bet = Bet(user_id=user.id, **body.model_dump())
    db.add(bet)
    db.commit()
    db.refresh(bet)
    return bet


@bets_router.patch("/{bet_id}", response_model=BetResponse)
def update_bet(
    bet_id: int,
    body: BetUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bet = _get_owned_bet(bet_id, user, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(bet, field, value)
    db.commit()
    db.refresh(bet)
    return bet


@bets_router.delete("/{bet_id}", status_code=204)
def delete_bet(
    bet_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bet = _get_owned_bet(bet_id, user, db)
    db.delete(bet)
    db.commit()
