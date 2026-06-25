import styles from "./NavTabs.module.css";

export type AppTab = "value-bets" | "arbitrage";

interface NavTabsProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

export default function NavTabs({ active, onChange }: NavTabsProps) {
  return (
    <nav className={styles.navTabs}>
      <button
        className={`${styles.tabBtn} ${active === "value-bets" ? styles.active : ""}`}
        onClick={() => onChange("value-bets")}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
        Value Bet Finder
      </button>
      <button
        className={`${styles.tabBtn} ${active === "arbitrage" ? styles.active : ""}`}
        onClick={() => onChange("arbitrage")}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        Arbitrage Finder
      </button>
    </nav>
  );
}
