import { formatAmerican, pct } from "../lib/format";
import type { ArbitrageOpportunity } from "../types";
import TeamLogo from "./TeamLogo";
import styles from "./ArbitrageOpportunityCard.module.css";

interface ArbitrageOpportunityCardProps {
  opportunity: ArbitrageOpportunity;
  bankroll: number;
}

export default function ArbitrageOpportunityCard({
  opportunity,
  bankroll,
}: ArbitrageOpportunityCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>{opportunity.event_label}</h3>
          <div className={styles.cardMeta}>
            <span>{opportunity.sport}</span>
            <span>{opportunity.market_label}</span>
          </div>
        </div>
        <div className={styles.badge}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          +{pct(opportunity.profit_pct)} Profit
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th>Outcome</th>
                <th>Best Book</th>
                <th>American</th>
                <th>Decimal</th>
                <th>Implied %</th>
                <th>Required Stake</th>
                <th>Guaranteed Payout</th>
              </tr>
            </thead>
            <tbody>
              {opportunity.outcomes.map((out) => (
                <tr key={out.outcome}>
                  <td>
                    <span className={styles.outcomeCell}>
                      <TeamLogo name={out.outcome} sport={opportunity.sport} />
                      <strong>{out.outcome}</strong>
                    </span>
                  </td>
                  <td>{out.book}</td>
                  <td>{formatAmerican(out.american_odds)}</td>
                  <td>{out.decimal_odds.toFixed(3)}</td>
                  <td>{pct(out.implied_prob)}</td>
                  <td>
                    <strong style={{ color: "var(--accent-color)" }}>
                      ${out.stake.toFixed(2)}
                    </strong>
                  </td>
                  <td>${(out.stake * out.decimal_odds).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles.cardFooter}>
        <div>
          Total Implied Probability: <strong>{pct(opportunity.total_implied_prob)}</strong>
        </div>
        <div>
          Total Stake: <strong>${bankroll.toFixed(2)}</strong>
        </div>
        <div className={styles.profitHighlight}>
          Guaranteed Profit: +${opportunity.profit_amount.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
