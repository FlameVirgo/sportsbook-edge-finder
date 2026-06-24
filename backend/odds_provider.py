from abc import ABC, abstractmethod

from backend.mock_data import MOCK_EVENTS


class OddsProvider(ABC):
    @abstractmethod
    def list_events(self) -> list[dict]:
        ...

    @abstractmethod
    def get_market(self, event_id: str, market_id: str) -> dict:
        ...


class MockOddsProvider(OddsProvider):
    """Reads from mock_data.py. Swap point for a real provider later, e.g.
    a TheOddsAPIProvider implementing the same two methods against a live API."""

    def __init__(self, events: list[dict] = MOCK_EVENTS):
        self._events = events

    def list_events(self) -> list[dict]:
        return self._events

    def get_market(self, event_id: str, market_id: str) -> dict:
        for event in self._events:
            if event["event_id"] != event_id:
                continue
            for market in event["markets"]:
                if market["market_id"] == market_id:
                    return market
        raise KeyError(f"market {market_id} not found for event {event_id}")


class CompositeOddsProvider(OddsProvider):
    """Merges the mock provider (player props, demo richness) with a live
    provider (real moneyline odds). Live event ids are prefixed "live_" by
    the live provider, so routing is just a prefix check."""

    def __init__(self, mock_provider: OddsProvider, live_provider: OddsProvider):
        self._mock = mock_provider
        self._live = live_provider

    def list_events(self) -> list[dict]:
        return self._mock.list_events() + self._live.list_events()

    def get_market(self, event_id: str, market_id: str) -> dict:
        if event_id.startswith("live_"):
            return self._live.get_market(event_id, market_id)
        return self._mock.get_market(event_id, market_id)
