import { useEffect, useState } from "react";
import { getArbitrageOpportunities } from "../api/client";
import type { ArbitrageOpportunity } from "../types";
import ArbitrageOpportunityCard from "./ArbitrageOpportunityCard";
import Panel from "./Panel";
import SportTabs from "./SportTabs";
import styles from "./ArbitrageView.module.css";

const ARB_SPORTS = ["NFL", "FIFA World Cup"];

interface ArbitrageViewProps {
  bankroll: number;
  onBankrollChange: (value: number) => void;
}

export default function ArbitrageView({ bankroll, onBankrollChange }: ArbitrageViewProps) {
  const [selectedSport, setSelectedSport] = useState(ARB_SPORTS[0]);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function scan() {
    getArbitrageOpportunities(bankroll, selectedSport)
      .then((data) => {
        setOpportunities(data);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSport, bankroll]);

  return (
    <div className={styles.dashboardGrid}>
      <Panel
        title="Configure Arbitrage"
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l3 3" />
          </svg>
        }
      >
        <div className={styles.fieldRow}>
          <label htmlFor="arb-bankroll">Bankroll ($)</label>
          <input
            type="number"
            id="arb-bankroll"
            value={bankroll}
            min={0}
            step={50}
            onChange={(e) => onBankrollChange(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className={styles.fieldRow}>
          <label>Sport</label>
          <SportTabs sports={ARB_SPORTS} selected={selectedSport} onSelect={setSelectedSport} />
        </div>
        <button onClick={scan}>Scan for Arbitrage</button>
      </Panel>

      <Panel
        title="Arbitrage Opportunities"
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      >
        <div className={styles.summaryBanner}>
          {error ? (
            `Error: ${error}`
          ) : opportunities === null ? (
            "Scan to find active arbitrage windows across sportsbooks."
          ) : opportunities.length === 0 ? (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--danger-color)" }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              No arbitrage opportunities found across the current markets.
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--success-color)" }}
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Found {opportunities.length} guaranteed arbitrage opportunities!
            </>
          )}
        </div>

        {opportunities && opportunities.length === 0 && (
          <div className={styles.emptyState}>
            No arbitrage opportunities are currently available. Check back when odds shift!
          </div>
        )}

        {opportunities && opportunities.length > 0 && (
          <div className={styles.opportunitiesList}>
            {opportunities.map((opp) => (
              <ArbitrageOpportunityCard
                key={`${opp.event_id}-${opp.market_id}`}
                opportunity={opp}
                bankroll={bankroll}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
