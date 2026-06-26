import { TrendingUp } from "lucide-react";
import AccountMenu from "./AccountMenu";
import styles from "./Header.module.css";

interface HeaderProps {
  onNavigateToMyBets: () => void;
}

export default function Header({ onNavigateToMyBets }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerSpacer} />
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          <TrendingUp size={36} color="#00d68f" strokeWidth={2.5} />
          Sportsbook Edge Finder
        </h1>
        <p className={styles.subtitle}>
          Compare live sportsbook odds, de-vig the sharp reference line, and size your stake with
          Kelly — all in real time.
        </p>
      </div>
      <AccountMenu onNavigateToMyBets={onNavigateToMyBets} />
    </header>
  );
}
