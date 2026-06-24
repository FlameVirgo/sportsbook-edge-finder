import math


def joint_prob_independent(p1: float, p2: float) -> float:
    return p1 * p2


def joint_prob_correlated(p1: float, p2: float, rho: float) -> float:
    raw = p1 * p2 + rho * math.sqrt(p1 * (1 - p1) * p2 * (1 - p2))
    return max(0.0, min(raw, min(p1, p2), 1.0))


def correlation_edge_report(p1: float, p2: float, rho: float, parlay_decimal_odds: float) -> dict:
    independent_prob = joint_prob_independent(p1, p2)
    correlated_prob = joint_prob_correlated(p1, p2, rho)
    platform_implied_prob = 1 / parlay_decimal_odds
    return {
        "independent_prob": independent_prob,
        "correlated_prob": correlated_prob,
        "structural_edge": correlated_prob - independent_prob,
        "platform_implied_prob": platform_implied_prob,
        "ev_naive_independent": independent_prob * parlay_decimal_odds - 1,
        "ev_correlated": correlated_prob * parlay_decimal_odds - 1,
    }
