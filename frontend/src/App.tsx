import { useEffect, useState } from "react";
import styles from "./App.module.css";
import ArbitrageView from "./components/ArbitrageView";
import AuthModal from "./components/AuthModal";
import Header from "./components/Header";
import MyBetsView from "./components/MyBetsView";
import NavTabs, { type AppTab } from "./components/NavTabs";
import ValueBetsView from "./components/ValueBetsView";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("value-bets");
  const [bankroll, setBankroll] = useState(1000);
  const { refreshUser, authModalOpen, authModalMode } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      // Webhook delivery can lag the redirect by a second or two.
      const attempts = [500, 1500, 3000];
      attempts.forEach((delay) => setTimeout(() => refreshUser(), delay));
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("checkout") === "cancel") {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.container}>
      <Header onNavigateToMyBets={() => setActiveTab("my-bets")} />
      <NavTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "value-bets" && (
        <ValueBetsView bankroll={bankroll} onBankrollChange={setBankroll} />
      )}
      {activeTab === "arbitrage" && (
        <ArbitrageView bankroll={bankroll} onBankrollChange={setBankroll} />
      )}
      {activeTab === "my-bets" && <MyBetsView />}

      {authModalOpen && <AuthModal key={authModalMode} />}
    </div>
  );
}
