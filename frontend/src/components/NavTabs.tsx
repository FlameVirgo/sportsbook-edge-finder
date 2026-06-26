import { Clock, ListChecks, TrendingUp } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import styles from "./NavTabs.module.css";

export type AppTab = "value-bets" | "arbitrage" | "my-bets";

interface NavTabsProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

export default function NavTabs({ active, onChange }: NavTabsProps) {
  const { user } = useAuth();

  return (
    <nav className={styles.navTabs}>
      <button
        className={`${styles.tabBtn} ${active === "value-bets" ? styles.active : ""}`}
        onClick={() => onChange("value-bets")}
      >
        <TrendingUp size={18} strokeWidth={2.5} />
        Value Bet Finder
      </button>
      <button
        className={`${styles.tabBtn} ${active === "arbitrage" ? styles.active : ""}`}
        onClick={() => onChange("arbitrage")}
      >
        <Clock size={18} />
        Arbitrage Finder
      </button>
      {user && (
        <button
          className={`${styles.tabBtn} ${active === "my-bets" ? styles.active : ""}`}
          onClick={() => onChange("my-bets")}
        >
          <ListChecks size={18} />
          My Bets
        </button>
      )}
    </nav>
  );
}
