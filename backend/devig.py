from enum import Enum


class DevigMethod(str, Enum):
    MULTIPLICATIVE = "multiplicative"
    # POWER = "power"  # not implemented yet
    # SHIN = "shin"    # not implemented yet


def multiplicative_devig(implied_probs: list[float]) -> list[float]:
    total = sum(implied_probs)
    if total == 0:
        raise ValueError("implied probabilities cannot all be zero")
    return [q / total for q in implied_probs]


def devig(implied_probs: list[float], method: DevigMethod = DevigMethod.MULTIPLICATIVE) -> list[float]:
    if method == DevigMethod.MULTIPLICATIVE:
        return multiplicative_devig(implied_probs)
    raise NotImplementedError(f"devig method {method} not implemented")
