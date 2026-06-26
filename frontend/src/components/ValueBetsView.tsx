import { BarChart3, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { analyzeBet, ApiError, getEvents } from "../api/client";
import type { AnalysisResult, Event, SelectedBet } from "../types";
import { pct } from "../lib/format";
import GameList from "./GameList";
import Panel from "./Panel";
import RecommendationCallout from "./RecommendationCallout";
import ResultsTable from "./ResultsTable";
import SportTabs from "./SportTabs";
import UpgradePrompt from "./UpgradePrompt";
import styles from "./ValueBetsView.module.css";

interface ValueBetsViewProps {
  bankroll: number;
  onBankrollChange: (value: number) => void;
}

export default function ValueBetsView({ bankroll, onBankrollChange }: ValueBetsViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedBet, setSelectedBet] = useState<SelectedBet | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  useEffect(() => {
    getEvents().then((fetched) => {
      setEvents(fetched);
      const sports = [...new Set(fetched.map((e) => e.sport))].sort();
      setSelectedSport(sports[0] ?? null);
    });
  }, []);

  useEffect(() => {
    if (!selectedBet) return;
    analyzeBet(selectedBet, bankroll)
      .then((data) => {
        setResult(data);
        setError(null);
        setErrorStatus(null);
      })
      .catch((err: ApiError) => {
        setError(err.message);
        setErrorStatus(err.status);
      });
  }, [selectedBet, bankroll]);

  const sports = [...new Set(events.map((e) => e.sport))].sort();
  const eventsForSport = events.filter((e) => e.sport === selectedSport);

  return (
    <div className={styles.dashboardGrid}>
      <Panel title="Configure Bet" icon={<CheckCircle2 size={20} />}>
        <div className={styles.fieldRow}>
          <label htmlFor="bankroll">Bankroll ($)</label>
          <input
            type="number"
            id="bankroll"
            value={bankroll}
            min={0}
            step={50}
            onChange={(e) => onBankrollChange(parseFloat(e.target.value) || 0)}
          />
        </div>
        <SportTabs sports={sports} selected={selectedSport} onSelect={setSelectedSport} />
        <GameList
          events={eventsForSport}
          selectedBet={selectedBet}
          onSelectOutcome={setSelectedBet}
        />
      </Panel>

      <Panel title="Edge Analysis Results" icon={<BarChart3 size={20} />}>
        {errorStatus === 401 ? (
          <UpgradePrompt reason="login" />
        ) : errorStatus === 402 ? (
          <UpgradePrompt reason="subscribe" />
        ) : (
          <>
            <div className={styles.banner}>
              {error
                ? `Error: ${error}`
                : result
                  ? `True probability for "${result.selected_outcome}" sourced from ${result.p_true_source} → ${pct(result.p_true)}`
                  : "Pick a side from a game card to see how the books compare."}
            </div>
            {result && <RecommendationCallout result={result} bankroll={bankroll} />}
            <ResultsTable rows={result?.rows ?? []} />
          </>
        )}
      </Panel>
    </div>
  );
}
