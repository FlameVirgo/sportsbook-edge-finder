def ev_per_unit(p_true: float, decimal_odds: float) -> float:
    return p_true * decimal_odds - 1


def full_kelly_fraction(p_true: float, decimal_odds: float) -> float:
    """Growth-optimal stake fraction. Can be negative (negative edge) — the
    raw signed value is what should be displayed, so a -EV book's true
    Kelly fraction isn't hidden behind a misleading 0.00%."""
    if decimal_odds <= 1:
        return 0.0
    return (p_true * decimal_odds - 1) / (decimal_odds - 1)


def kelly_stake(full_kelly_pct: float, bankroll: float) -> float:
    """Negative Kelly means don't bet, so the dollar stake floors at 0
    even though full_kelly_pct itself is left unclamped for display."""
    return max(full_kelly_pct, 0.0) * bankroll
