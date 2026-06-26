// Mirrors backend/models.py and the event shape returned by
// backend/live_odds_provider.py. Keep these in sync with the Python
// side by hand — there's no shared schema generation (yet).

export interface Book {
  book: string;
  is_sharp: boolean;
  odds: Record<string, number>;
}

export interface Market {
  market_id: string;
  market_label: string;
  outcomes: string[];
  books: Book[];
}

export interface Event {
  event_id: string;
  event_label: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  sport: string;
  markets: Market[];
}

export interface BookRow {
  book: string;
  american_odds: number;
  decimal_odds: number;
  implied_prob: number;
  ev: number;
  edge: number;
  full_kelly_pct: number;
  recommended_stake: number;
}

export interface AnalysisResult {
  sharp_book: string;
  p_true: number;
  p_true_source: string;
  selected_outcome: string;
  best_book: string | null;
  rows: BookRow[];
}

export interface ArbitrageOutcome {
  outcome: string;
  book: string;
  american_odds: number;
  decimal_odds: number;
  implied_prob: number;
  stake: number;
}

export interface ArbitrageOpportunity {
  event_id: string;
  event_label: string;
  sport: string;
  market_id: string;
  market_label: string;
  outcomes: ArbitrageOutcome[];
  total_implied_prob: number;
  profit_pct: number;
  profit_amount: number;
}

export interface SelectedBet {
  eventId: string;
  marketId: string;
  outcome: string;
}

export interface UserResponse {
  id: number;
  email: string;
  subscription_status: string;
  created_at: string;
}

export type BetOutcome = "pending" | "win" | "loss" | "push";

export interface LoggedBet {
  id: number;
  sportsbook: string;
  market_description: string;
  american_odds: number;
  stake: number;
  outcome: BetOutcome;
  placed_at: string;
  settled_at: string | null;
  notes: string | null;
}

export interface LoggedBetCreate {
  sportsbook: string;
  market_description: string;
  american_odds: number;
  stake: number;
  outcome?: BetOutcome;
  placed_at: string;
  notes?: string | null;
}

export interface LoggedBetUpdate {
  outcome?: BetOutcome;
  settled_at?: string | null;
  notes?: string | null;
}
