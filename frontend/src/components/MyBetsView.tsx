import { History, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createBet, deleteBet, listBets, updateBet } from "../api/client";
import { formatAmerican } from "../lib/format";
import type { BetOutcome, LoggedBet } from "../types";
import Panel from "./Panel";
import styles from "./MyBetsView.module.css";

function profitFor(bet: LoggedBet): number {
  if (bet.outcome === "pending" || bet.outcome === "push") return 0;
  const winReturn =
    bet.american_odds > 0 ? bet.stake * (bet.american_odds / 100) : bet.stake * (100 / Math.abs(bet.american_odds));
  return bet.outcome === "win" ? winReturn : -bet.stake;
}

function todayLocalDatetime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function MyBetsView() {
  const [bets, setBets] = useState<LoggedBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportsbook, setSportsbook] = useState("");
  const [marketDescription, setMarketDescription] = useState("");
  const [americanOdds, setAmericanOdds] = useState("");
  const [stake, setStake] = useState("");
  const [placedAt, setPlacedAt] = useState(todayLocalDatetime());
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    listBets()
      .then(setBets)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createBet({
        sportsbook,
        market_description: marketDescription,
        american_odds: parseFloat(americanOdds),
        stake: parseFloat(stake),
        placed_at: new Date(placedAt).toISOString(),
      });
      setSportsbook("");
      setMarketDescription("");
      setAmericanOdds("");
      setStake("");
      setPlacedAt(todayLocalDatetime());
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOutcomeChange(bet: LoggedBet, outcome: BetOutcome) {
    await updateBet(bet.id, {
      outcome,
      settled_at: outcome === "pending" ? null : new Date().toISOString(),
    });
    refresh();
  }

  async function handleDelete(id: number) {
    await deleteBet(id);
    refresh();
  }

  const settled = bets.filter((b) => b.outcome === "win" || b.outcome === "loss");
  const wins = bets.filter((b) => b.outcome === "win").length;
  const winRate = settled.length > 0 ? (wins / settled.length) * 100 : 0;
  const netProfit = bets.reduce((sum, b) => sum + profitFor(b), 0);

  return (
    <div className={styles.dashboardGrid}>
      <Panel title="Log a Bet" icon={<PlusCircle size={20} />}>
        <form onSubmit={handleSubmit}>
          <div className={styles.fieldRow}>
            <label htmlFor="bet-sportsbook">Sportsbook</label>
            <input
              id="bet-sportsbook"
              required
              value={sportsbook}
              onChange={(e) => setSportsbook(e.target.value)}
              placeholder="e.g. DraftKings"
            />
          </div>
          <div className={styles.fieldRow}>
            <label htmlFor="bet-market">Bet description</label>
            <input
              id="bet-market"
              required
              value={marketDescription}
              onChange={(e) => setMarketDescription(e.target.value)}
              placeholder="e.g. Seahawks ML"
            />
          </div>
          <div className={styles.fieldRow}>
            <label htmlFor="bet-odds">American odds</label>
            <input
              id="bet-odds"
              type="number"
              required
              value={americanOdds}
              onChange={(e) => setAmericanOdds(e.target.value)}
              placeholder="-110"
            />
          </div>
          <div className={styles.fieldRow}>
            <label htmlFor="bet-stake">Stake ($)</label>
            <input
              id="bet-stake"
              type="number"
              min={0}
              step="0.01"
              required
              value={stake}
              onChange={(e) => setStake(e.target.value)}
            />
          </div>
          <div className={styles.fieldRow}>
            <label htmlFor="bet-placed-at">Placed at</label>
            <input
              id="bet-placed-at"
              type="datetime-local"
              required
              value={placedAt}
              onChange={(e) => setPlacedAt(e.target.value)}
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Log Bet"}
          </button>
        </form>
      </Panel>

      <Panel title="Bet History" icon={<History size={20} />}>
        <div className={styles.summaryRow}>
          <div className={styles.summaryStat}>
            <div className={styles.value}>{bets.length}</div>
            <div className={styles.label}>Total Bets</div>
          </div>
          <div className={styles.summaryStat}>
            <div className={styles.value}>{settled.length > 0 ? `${winRate.toFixed(1)}%` : "—"}</div>
            <div className={styles.label}>Win Rate</div>
          </div>
          <div className={styles.summaryStat}>
            <div
              className={styles.value}
              style={{ color: netProfit >= 0 ? "var(--positive-color)" : "var(--danger-color)" }}
            >
              {netProfit >= 0 ? "+" : ""}${netProfit.toFixed(2)}
            </div>
            <div className={styles.label}>Net P&L</div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Sportsbook</th>
                <th>Bet</th>
                <th>Odds</th>
                <th>Stake</th>
                <th>Outcome</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    Loading…
                  </td>
                </tr>
              ) : bets.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    No bets logged yet — add your first one.
                  </td>
                </tr>
              ) : (
                bets.map((bet) => (
                  <tr key={bet.id}>
                    <td>{new Date(bet.placed_at).toLocaleDateString()}</td>
                    <td>{bet.sportsbook}</td>
                    <td>{bet.market_description}</td>
                    <td>{formatAmerican(bet.american_odds)}</td>
                    <td>${bet.stake.toFixed(2)}</td>
                    <td>
                      <select
                        className={styles.outcomeSelect}
                        value={bet.outcome}
                        onChange={(e) => handleOutcomeChange(bet, e.target.value as BetOutcome)}
                      >
                        <option value="pending">Pending</option>
                        <option value="win">Win</option>
                        <option value="loss">Loss</option>
                        <option value="push">Push</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(bet.id)}
                        aria-label="Delete bet"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
