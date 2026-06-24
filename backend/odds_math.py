def american_to_decimal(american: float) -> float:
    if american > 0:
        return american / 100 + 1
    return 100 / abs(american) + 1


def decimal_to_american(decimal: float) -> float:
    if decimal >= 2:
        return (decimal - 1) * 100
    return -100 / (decimal - 1)


def implied_prob_from_decimal(decimal: float) -> float:
    return 1 / decimal


def implied_prob_from_american(american: float) -> float:
    return implied_prob_from_decimal(american_to_decimal(american))
