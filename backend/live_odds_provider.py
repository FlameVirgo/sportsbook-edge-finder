from typing import Optional

import requests

from backend.odds_provider import OddsProvider

ODDS_API_BASE = "https://api.the-odds-api.com/v4"
SHARP_BOOKMAKER_KEY = "pinnacle"

SPORT_LABELS = {
    "americanfootball_nfl": "NFL",
    "basketball_nba": "NBA",
    "soccer_epl": "Soccer - EPL",
}


class TheOddsApiProvider(OddsProvider):
    """Live moneyline (h2h) odds from The Odds API.

    Scoped to h2h only: spreads/totals quote different point lines per
    book, which breaks the "same outcomes across all books" comparison
    analysis.py relies on. h2h outcomes (team names, or draw) are always
    identical across books, so they compose cleanly with the existing
    devig/EV/Kelly pipeline.

    Markets/events are fetched once per process and cached in memory —
    there's no live-refresh here, matching the rest of this project's
    "no DB, keep it simple" approach. Restart the server to refresh.
    """

    def __init__(self, api_key: str, sports: list[str]):
        self.api_key = api_key
        self.sports = sports
        self._events_by_sport: dict = {}

    def _fetch_sport(self, sport: str) -> list[dict]:
        if sport not in self._events_by_sport:
            try:
                resp = requests.get(
                    f"{ODDS_API_BASE}/sports/{sport}/odds",
                    params={
                        "apiKey": self.api_key,
                        "regions": "us,eu",
                        "markets": "h2h",
                        "oddsFormat": "american",
                    },
                    timeout=10,
                )
                resp.raise_for_status()
                self._events_by_sport[sport] = resp.json()
            except requests.RequestException:
                self._events_by_sport[sport] = []
        return self._events_by_sport[sport]

    def _build_market(self, event: dict) -> Optional[dict]:
        books = []
        for bookmaker in event.get("bookmakers", []):
            h2h = next((m for m in bookmaker["markets"] if m["key"] == "h2h"), None)
            if h2h is None:
                continue
            odds = {o["name"]: o["price"] for o in h2h["outcomes"]}
            books.append({
                "book": bookmaker["title"],
                "is_sharp": bookmaker["key"] == SHARP_BOOKMAKER_KEY,
                "odds": odds,
            })

        if not any(b["is_sharp"] for b in books):
            return None  # no sharp reference available for this event, skip it

        outcomes = list({outcome for b in books for outcome in b["odds"]})
        books = [b for b in books if all(o in b["odds"] for o in outcomes)]
        if len(books) < 2:
            return None

        return {
            "market_id": "h2h",
            "market_label": "Moneyline",
            "outcomes": outcomes,
            "books": books,
        }

    def list_events(self) -> list[dict]:
        result = []
        for sport in self.sports:
            for event in self._fetch_sport(sport):
                market = self._build_market(event)
                if market is None:
                    continue
                result.append({
                    "event_id": event["id"],
                    "event_label": f"{event['home_team']} vs {event['away_team']}",
                    "home_team": event["home_team"],
                    "away_team": event["away_team"],
                    "commence_time": event["commence_time"],
                    "sport": SPORT_LABELS.get(sport, sport),
                    "markets": [market],
                })
        return result

    def get_market(self, event_id: str, market_id: str) -> dict:
        for sport in self.sports:
            for event in self._fetch_sport(sport):
                if event["id"] != event_id:
                    continue
                market = self._build_market(event)
                if market is not None and market["market_id"] == market_id:
                    return market
        raise KeyError(f"market {market_id} not found for event {event_id}")
