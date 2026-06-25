import type { AnalysisResult, ArbitrageOpportunity, Event, SelectedBet } from "../types";

class ApiError extends Error {}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new ApiError(err.detail ?? `Request to ${url} failed`);
  }
  return res.json() as Promise<T>;
}

export function getEvents(): Promise<Event[]> {
  return getJson<Event[]>("/api/events");
}

export function analyzeBet(bet: SelectedBet, bankroll: number): Promise<AnalysisResult> {
  const params = new URLSearchParams({
    event_id: bet.eventId,
    market_id: bet.marketId,
    outcome: bet.outcome,
    bankroll: String(bankroll),
  });
  return getJson<AnalysisResult>(`/api/analyze?${params.toString()}`);
}

export function getArbitrageOpportunities(
  bankroll: number,
  sport: string,
): Promise<ArbitrageOpportunity[]> {
  const params = new URLSearchParams({ bankroll: String(bankroll), sport });
  return getJson<ArbitrageOpportunity[]>(`/api/arbitrage?${params.toString()}`);
}
