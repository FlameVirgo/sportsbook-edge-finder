KELLY_MULTIPLIERS = {"quarter": 0.25, "half": 0.5, "full": 1.0}


def ev_per_unit(p_true: float, decimal_odds: float) -> float:
    return p_true * decimal_odds - 1


def full_kelly_fraction(p_true: float, decimal_odds: float) -> float:
    """Growth-optimal stake fraction. Clamped to >= 0: negative Kelly means
    don't bet, but callers should still surface the raw negative EV/edge
    elsewhere rather than hiding the book entirely."""
    if decimal_odds <= 1:
        return 0.0
    f = (p_true * decimal_odds - 1) / (decimal_odds - 1)
    return max(f, 0.0)


def fractional_kelly_stake(full_kelly_pct: float, multiplier: float, bankroll: float) -> float:
    return full_kelly_pct * multiplier * bankroll
