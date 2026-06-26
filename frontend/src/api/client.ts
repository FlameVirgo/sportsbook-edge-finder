import type {
  AnalysisResult,
  ArbitrageOpportunity,
  Event,
  LoggedBet,
  LoggedBetCreate,
  LoggedBetUpdate,
  SelectedBet,
  UserResponse,
} from "../types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  url: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.auth ? authHeaders() : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.detail ?? `Request to ${url} failed`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function getEvents(): Promise<Event[]> {
  return request<Event[]>("/api/events");
}

export function analyzeBet(bet: SelectedBet, bankroll: number): Promise<AnalysisResult> {
  const params = new URLSearchParams({
    event_id: bet.eventId,
    market_id: bet.marketId,
    outcome: bet.outcome,
    bankroll: String(bankroll),
  });
  return request<AnalysisResult>(`/api/analyze?${params.toString()}`, { auth: true });
}

export function getArbitrageOpportunities(
  bankroll: number,
  sport: string,
): Promise<ArbitrageOpportunity[]> {
  const params = new URLSearchParams({ bankroll: String(bankroll), sport });
  return request<ArbitrageOpportunity[]>(`/api/arbitrage?${params.toString()}`, { auth: true });
}

// --- Auth ---

export function signup(email: string, password: string): Promise<{ access_token: string }> {
  return request("/api/auth/signup", { method: "POST", body: { email, password } });
}

export function login(email: string, password: string): Promise<{ access_token: string }> {
  return request("/api/auth/login", { method: "POST", body: { email, password } });
}

export function getCurrentUser(): Promise<UserResponse> {
  return request<UserResponse>("/api/auth/me", { auth: true });
}

// --- Bet ledger ---

export function listBets(): Promise<LoggedBet[]> {
  return request<LoggedBet[]>("/api/bets", { auth: true });
}

export function createBet(bet: LoggedBetCreate): Promise<LoggedBet> {
  return request<LoggedBet>("/api/bets", { method: "POST", body: bet, auth: true });
}

export function updateBet(id: number, patch: LoggedBetUpdate): Promise<LoggedBet> {
  return request<LoggedBet>(`/api/bets/${id}`, { method: "PATCH", body: patch, auth: true });
}

export function deleteBet(id: number): Promise<void> {
  return request<void>(`/api/bets/${id}`, { method: "DELETE", auth: true });
}

// --- Billing ---

export function createCheckoutSession(): Promise<{ url: string }> {
  return request("/api/billing/create-checkout-session", { method: "POST", auth: true });
}

export function createPortalSession(): Promise<{ url: string }> {
  return request("/api/billing/create-portal-session", { method: "POST", auth: true });
}
