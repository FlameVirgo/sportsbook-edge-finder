import type { Event, SelectedBet } from "../types";
import GameCard from "./GameCard";
import styles from "./GameCard.module.css";

interface GameListProps {
  events: Event[];
  selectedBet: SelectedBet | null;
  onSelectOutcome: (bet: SelectedBet) => void;
}

export default function GameList({ events, selectedBet, onSelectOutcome }: GameListProps) {
  if (events.length === 0) {
    return (
      <div className={styles.gameList}>
        <p className={styles.gameListEmpty}>No live games right now for this sport.</p>
      </div>
    );
  }

  return (
    <div className={styles.gameList}>
      {events.map((event) => (
        <GameCard
          key={event.event_id}
          event={event}
          selectedBet={selectedBet}
          onSelectOutcome={onSelectOutcome}
        />
      ))}
    </div>
  );
}
