from backend.devig import DevigMethod, devig
from backend.kelly import ev_per_unit, full_kelly_fraction, kelly_stake
from backend.models import AnalysisResult, BookRow, ArbitrageOutcome, ArbitrageOpportunity
from backend.odds_math import american_to_decimal, implied_prob_from_american, implied_prob_from_decimal
from backend.odds_provider import OddsProvider


def analyze_market(
    event_id: str,
    market_id: str,
    selected_outcome: str,
    provider: OddsProvider,
    devig_method: DevigMethod = DevigMethod.MULTIPLICATIVE,
    bankroll: float = 1000.0,
) -> AnalysisResult:
    market = provider.get_market(event_id, market_id)
    sharp_book = next(b for b in market["books"] if b["is_sharp"])

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
    rows = rows[:15]

    return AnalysisResult(
        sharp_book=sharp_book["book"],
        p_true=p_true,
        p_true_source=source,
        selected_outcome=selected_outcome,
        best_book=rows[0].book if rows else None,
        rows=rows,
    )


def find_arbitrage_opportunities(
    provider: OddsProvider,
    bankroll: float = 1000.0,
) -> list[ArbitrageOpportunity]:
    events = provider.list_events()
    opportunities = []

    for event in events:
        event_id = event["event_id"]
        event_label = event["event_label"]
        sport = event["sport"]

        for market in event["markets"]:
            market_id = market["market_id"]
            market_label = market["market_label"]
            outcomes = market["outcomes"]
            books = market["books"]

            # Find the best odds and corresponding bookmaker for each outcome
            best_odds = {}
            for outcome in outcomes:
                best_american = None
                best_decimal = -1.0
                best_book_name = None

                for book in books:
                    if outcome not in book["odds"]:
                        continue
                    amer = book["odds"][outcome]
                    dec = american_to_decimal(amer)
                    if dec > best_decimal:
                        best_decimal = dec
                        best_american = amer
                        best_book_name = book["book"]

                if best_book_name is not None:
                    best_odds[outcome] = {
                        "book": best_book_name,
                        "american_odds": best_american,
                        "decimal_odds": best_decimal,
                        "implied_prob": 1.0 / best_decimal,
                    }

            # Check that we have valid odds for all outcomes in this market
            if len(best_odds) != len(outcomes):
                continue

            # Compute sum of implied probabilities
            total_implied_prob = sum(info["implied_prob"] for info in best_odds.values())

            # An arbitrage opportunity exists if the sum of implied probabilities is less than 1 (with small buffer)
            if total_implied_prob < 0.9999:
                profit_pct = (1.0 / total_implied_prob) - 1.0
                profit_amount = bankroll * profit_pct

                arb_outcomes = []
                for outcome in outcomes:
                    info = best_odds[outcome]
                    # Stake allocation: bankroll * (outcome_implied_prob / total_implied_prob)
                    stake = bankroll * (info["implied_prob"] / total_implied_prob)
                    arb_outcomes.append(ArbitrageOutcome(
                        outcome=outcome,
                        book=info["book"],
                        american_odds=info["american_odds"],
                        decimal_odds=info["decimal_odds"],
                        implied_prob=info["implied_prob"],
                        stake=round(stake, 2),
                    ))

                opportunities.append(ArbitrageOpportunity(
                    event_id=event_id,
                    event_label=event_label,
                    sport=sport,
                    market_id=market_id,
                    market_label=market_label,
                    outcomes=arb_outcomes,
                    total_implied_prob=total_implied_prob,
                    profit_pct=profit_pct,
                    profit_amount=round(profit_amount, 2),
                ))

    # Sort opportunities by profit percentage descending
    opportunities.sort(key=lambda x: x.profit_pct, reverse=True)
    return opportunities
