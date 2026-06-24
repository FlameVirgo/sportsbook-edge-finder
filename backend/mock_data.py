MOCK_EVENTS = [
    {
        "event_id": "evt_brazil_scotland",
        "event_label": "Brazil vs Scotland",
        "sport": "Soccer - Friendly",
        "markets": [
            {
                "market_id": "vinicius_sot_over_0.5",
                "market_label": "Vinicius Jr. - Shots on Target Over 0.5",
                "outcomes": ["Over 0.5", "Under 0.5"],
                "books": [
                    {"book": "Pinnacle", "is_sharp": True,
                     "odds": {"Over 0.5": -135, "Under 0.5": 115}},
                    {"book": "DraftKings", "is_sharp": False,
                     "odds": {"Over 0.5": -110, "Under 0.5": -110}},
                    {"book": "FanDuel", "is_sharp": False,
                     "odds": {"Over 0.5": -120, "Under 0.5": 100}},
                    {"book": "BetMGM", "is_sharp": False,
                     "odds": {"Over 0.5": -105, "Under 0.5": -115}},
                ],
            },
            {
                "market_id": "ml_brazil_scotland",
                "market_label": "Moneyline (incl. Draw)",
                "outcomes": ["Brazil", "Draw", "Scotland"],
                "books": [
                    {"book": "Pinnacle", "is_sharp": True,
                     "odds": {"Brazil": -150, "Draw": 260, "Scotland": 500}},
                    {"book": "DraftKings", "is_sharp": False,
                     "odds": {"Brazil": -140, "Draw": 250, "Scotland": 480}},
                    {"book": "FanDuel", "is_sharp": False,
                     "odds": {"Brazil": -160, "Draw": 270, "Scotland": 520}},
                ],
            },
        ],
    },
    {
        "event_id": "evt_lakers_celtics",
        "event_label": "Lakers vs Celtics",
        "sport": "NBA",
        "markets": [
            {
                "market_id": "lebron_pts_over_25.5",
                "market_label": "LeBron James - Points Over 25.5",
                "outcomes": ["Over 25.5", "Under 25.5"],
                "books": [
                    {"book": "Pinnacle", "is_sharp": True,
                     "odds": {"Over 25.5": -125, "Under 25.5": 105}},
                    {"book": "DraftKings", "is_sharp": False,
                     "odds": {"Over 25.5": -115, "Under 25.5": -105}},
                    {"book": "Caesars", "is_sharp": False,
                     "odds": {"Over 25.5": -135, "Under 25.5": 115}},
                    {"book": "BetMGM", "is_sharp": False,
                     "odds": {"Over 25.5": -110, "Under 25.5": -110}},
                ],
            },
        ],
    },
    {
        "event_id": "evt_chiefs_bills",
        "event_label": "Chiefs vs Bills",
        "sport": "NFL",
        "markets": [
            {
                "market_id": "spread_chiefs_-2.5",
                "market_label": "Spread: Chiefs -2.5 / Bills +2.5",
                "outcomes": ["Chiefs -2.5", "Bills +2.5"],
                "books": [
                    {"book": "Pinnacle", "is_sharp": True,
                     "odds": {"Chiefs -2.5": -108, "Bills +2.5": -108}},
                    {"book": "DraftKings", "is_sharp": False,
                     "odds": {"Chiefs -2.5": -110, "Bills +2.5": -105}},
                    {"book": "FanDuel", "is_sharp": False,
                     "odds": {"Chiefs -2.5": -102, "Bills +2.5": -112}},
                    {"book": "Caesars", "is_sharp": False,
                     "odds": {"Chiefs -2.5": -105, "Bills +2.5": -110}},
                ],
            },
        ],
    },
]
