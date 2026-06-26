import { AlertCircle, Clock, DollarSign, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError, getArbitrageOpportunities } from "../api/client";
import type { ArbitrageOpportunity } from "../types";
import ArbitrageOpportunityCard from "./ArbitrageOpportunityCard";
import Panel from "./Panel";
import SportTabs from "./SportTabs";
import UpgradePrompt from "./UpgradePrompt";
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
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  function scan() {
    getArbitrageOpportunities(bankroll, selectedSport)
      .then((data) => {
        setOpportunities(data);
        setError(null);
        setErrorStatus(null);
      })
      .catch((err: ApiError) => {
        setError(err.message);
        setErrorStatus(err.status);
      });
  }

  useEffect(() => {
    scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSport, bankroll]);

  return (
    <div className={styles.dashboardGrid}>
      <Panel title="Configure Arbitrage" icon={<Clock size={20} />}>
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

      <Panel title="Arbitrage Opportunities" icon={<DollarSign size={20} />}>
        {errorStatus === 401 ? (
          <UpgradePrompt reason="login" />
        ) : errorStatus === 402 ? (
          <UpgradePrompt reason="subscribe" />
        ) : (
          <>
            <div className={styles.summaryBanner}>
              {error ? (
                `Error: ${error}`
              ) : opportunities === null ? (
                "Scan to find active arbitrage windows across sportsbooks."
              ) : opportunities.length === 0 ? (
                <>
                  <AlertCircle size={20} color="var(--danger-color)" />
                  No arbitrage opportunities found across the current markets.
                </>
              ) : (
                <>
                  <TrendingUp size={20} color="var(--success-color)" />
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
          </>
        )}
      </Panel>
    </div>
  );
}
