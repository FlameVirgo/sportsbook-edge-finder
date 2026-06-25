def american_to_decimal(american: float) -> float:
    if american == 0:
        raise ValueError("american odds cannot be 0")
    if american > 0:
        return american / 100 + 1
    return 100 / abs(american) + 1


def decimal_to_american(decimal: float) -> float:
    if decimal <= 1:
        raise ValueError("decimal odds must be greater than 1")
    if decimal >= 2:
        return (decimal - 1) * 100
    return -100 / (decimal - 1)


def implied_prob_from_decimal(decimal: float) -> float:
    if decimal <= 0:
        raise ValueError("decimal odds must be positive")
    return 1 / decimal


def implied_prob_from_american(american: float) -> float:
    return implied_prob_from_decimal(american_to_decimal(american))
