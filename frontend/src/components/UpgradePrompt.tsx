import { Check, Lock } from "lucide-react";
import { createCheckoutSession } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import styles from "./UpgradePrompt.module.css";

interface UpgradePromptProps {
  reason: "login" | "subscribe";
}

export default function UpgradePrompt({ reason }: UpgradePromptProps) {
  const { openAuthModal } = useAuth();

  if (reason === "login") {
    return (
      <div className={styles.card}>
        <Lock size={28} color="var(--accent-color)" />
        <div className={styles.headline}>Log in to find your edge</div>
        <div className={styles.cta}>
          <button onClick={() => openAuthModal("login")}>Log In</button>
        </div>
      </div>
    );
  }

  async function handleUpgrade() {
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch {
      alert("Billing isn't set up yet — check back soon.");
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.planName}>Pro Access</div>
      <div className={styles.price}>
        $19<span>/month</span>
      </div>
      <div className={styles.headline}>Unlock the full edge-finding toolkit</div>
      <ul className={styles.features}>
        <li>
          <Check size={16} /> Unlimited value-bet analysis
        </li>
        <li>
          <Check size={16} /> Real-time arbitrage scanning
        </li>
        <li>
          <Check size={16} /> Full Kelly stake sizing
        </li>
      </ul>
      <div className={styles.cta}>
        <button onClick={handleUpgrade}>Upgrade Now</button>
      </div>
    </div>
  );
}
