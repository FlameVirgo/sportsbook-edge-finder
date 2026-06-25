import { formatAmerican, pct } from "../lib/format";
import type { AnalysisResult } from "../types";
import styles from "./RecommendationCallout.module.css";

interface RecommendationCalloutProps {
  result: AnalysisResult;
  bankroll: number;
}

export default function RecommendationCallout({ result, bankroll }: RecommendationCalloutProps) {
  const best = result.rows[0];

  if (!best || best.edge <= 0) {
    return (
      <div className={`${styles.box} ${styles.noEdge}`}>
        <div className={styles.headline}>No positive-EV bet found</div>
        <div className={styles.detail}>
          Every book's price is at or below the true probability for "{result.selected_outcome}"
          — sit this one out rather than bet into a -EV line.
        </div>
      </div>
    );
  }

  const pctOfBankroll = bankroll > 0 ? (best.recommended_stake / bankroll) * 100 : 0;

  return (
    <div className={`${styles.box} ${styles.hasEdge}`}>
      <div className={styles.headline}>
        Bet ${best.recommended_stake.toFixed(2)} on {best.book}
      </div>
      <div className={styles.detail}>
        {pctOfBankroll.toFixed(2)}% of your ${bankroll.toFixed(2)} bankroll, full Kelly ·{" "}
        {pct(best.edge)} edge at {formatAmerican(best.american_odds)} (
        {best.decimal_odds.toFixed(3)} decimal)
      </div>
    </div>
  );
}
