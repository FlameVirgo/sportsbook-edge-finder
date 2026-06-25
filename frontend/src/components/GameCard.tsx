import { formatAmerican, formatKickoff } from "../lib/format";
import type { Event, SelectedBet } from "../types";
import styles from "./GameCard.module.css";

interface GameCardProps {
  event: Event;
  selectedBet: SelectedBet | null;
  onSelectOutcome: (bet: SelectedBet) => void;
}

export default function GameCard({ event, selectedBet, onSelectOutcome }: GameCardProps) {
  const market = event.markets[0];
  const sharpBook = market.books.find((b) => b.is_sharp);
  if (!sharpBook) return null;

  return (
    <div className={styles.gameCard}>
      <div className={styles.gameCardHeader}>
        <span className={styles.gameTime}>{formatKickoff(event.commence_time)}</span>
        <span className={styles.gameMarketLabel}>{market.market_label}</span>
      </div>
      {market.outcomes.map((outcome) => {
        const isSelected =
          selectedBet?.eventId === event.event_id &&
          selectedBet?.marketId === market.market_id &&
          selectedBet?.outcome === outcome;

        return (
          <div className={styles.teamRow} key={outcome}>
            <span className={styles.teamName}>{outcome}</span>
            <button
              className={`${styles.oddsBtn} ${isSelected ? styles.selected : ""}`}
              onClick={() =>
                onSelectOutcome({ eventId: event.event_id, marketId: market.market_id, outcome })
              }
            >
              {formatAmerican(sharpBook.odds[outcome])}
            </button>
          </div>
        );
      })}
    </div>
  );
}
