import { useState } from "react";
import styles from "./App.module.css";
import ArbitrageView from "./components/ArbitrageView";
import Header from "./components/Header";
import NavTabs, { type AppTab } from "./components/NavTabs";
import ValueBetsView from "./components/ValueBetsView";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("value-bets");
  const [bankroll, setBankroll] = useState(1000);

  return (
    <div className={styles.container}>
      <Header />
      <NavTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "value-bets" ? (
        <ValueBetsView bankroll={bankroll} onBankrollChange={setBankroll} />
      ) : (
        <ArbitrageView bankroll={bankroll} onBankrollChange={setBankroll} />
      )}
    </div>
  );
}
