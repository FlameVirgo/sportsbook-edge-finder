from typing import Optional

from backend.devig import DevigMethod, devig
from backend.kelly import ev_per_unit, full_kelly_fraction, kelly_stake
from backend.models import AnalysisResult, BookRow
from backend.odds_math import american_to_decimal, implied_prob_from_american, implied_prob_from_decimal
from backend.odds_provider import OddsProvider


def analyze_market(
    event_id: str,
    market_id: str,
    selected_outcome: str,
    provider: OddsProvider,
    devig_method: DevigMethod = DevigMethod.MULTIPLICATIVE,
    user_true_prob_override: Optional[float] = None,
    bankroll: float = 1000.0,
) -> AnalysisResult:
    market = provider.get_market(event_id, market_id)
    sharp_book = next(b for b in market["books"] if b["is_sharp"])

    if user_true_prob_override is not None:
        p_true = user_true_prob_override
        source = "user_override"
    else:
        sharp_implied = [implied_prob_from_american(sharp_book["odds"][o]) for o in market["outcomes"]]
        sharp_fair = devig(sharp_implied, devig_method)
        p_true = sharp_fair[market["outcomes"].index(selected_outcome)]
        source = f"sharp_reference:{sharp_book['book']}"

    rows = []
    for book in market["books"]:
        if book["book"] == sharp_book["book"]:
            continue
        american = book["odds"][selected_outcome]
        d = american_to_decimal(american)
        implied = implied_prob_from_decimal(d)
        ev = ev_per_unit(p_true, d)
        full_k = full_kelly_fraction(p_true, d)
        stake = kelly_stake(full_k, bankroll)
        rows.append(BookRow(
            book=book["book"], american_odds=american, decimal_odds=d,
            implied_prob=implied, ev=ev, edge=ev,
            full_kelly_pct=full_k, recommended_stake=stake,
        ))

    rows.sort(key=lambda r: r.edge, reverse=True)

    return AnalysisResult(
        sharp_book=sharp_book["book"],
        p_true=p_true,
        p_true_source=source,
        selected_outcome=selected_outcome,
        best_book=rows[0].book if rows else None,
        rows=rows,
    )
