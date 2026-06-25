from abc import ABC, abstractmethod


class OddsProvider(ABC):
    @abstractmethod
    def list_events(self) -> list[dict]:
        ...

    @abstractmethod
    def get_market(self, event_id: str, market_id: str) -> dict:
        ...
