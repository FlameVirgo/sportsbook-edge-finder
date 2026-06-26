import { CreditCard, ListChecks, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortalSession } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import styles from "./AccountMenu.module.css";

interface AccountMenuProps {
  onNavigateToMyBets: () => void;
}

export default function AccountMenu({ onNavigateToMyBets }: AccountMenuProps) {
  const { user, logout, openAuthModal } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) {
    return (
      <div className={styles.authButtons}>
        <button onClick={() => openAuthModal("login")}>Log In</button>
        <button className={styles.signUpBtn} onClick={() => openAuthModal("signup")}>
          Sign Up
        </button>
      </div>
    );
  }

  async function handleManageSubscription() {
    setOpen(false);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch {
      alert("No billing account yet — subscribe first to manage billing.");
    }
  }

  return (
    <div className={styles.accountMenu} ref={menuRef}>
      <button
        className={styles.avatarBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {user.email.slice(0, 2).toUpperCase()}
      </button>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownEmail}>{user.email}</div>
          <button
            className={styles.dropdownItem}
            onClick={() => {
              setOpen(false);
              onNavigateToMyBets();
            }}
          >
            <ListChecks size={16} /> My Bets
          </button>
          <button className={styles.dropdownItem} onClick={handleManageSubscription}>
            <CreditCard size={16} /> Manage Subscription
          </button>
          <button
            className={styles.dropdownItem}
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      )}
    </div>
  );
}
