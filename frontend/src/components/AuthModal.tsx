import { Eye, EyeOff, Lock, Mail, TrendingUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import styles from "./AuthModal.module.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function AuthModal() {
  const { authModalMode: mode, openAuthModal, closeAuthModal, login, signup, loginWithGoogle } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAuthModal();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeAuthModal]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google || !googleBtnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: ({ credential }) => {
        setError(null);
        loginWithGoogle(credential).catch((err) => {
          setError(err instanceof ApiError ? err.message : "Google sign-in failed");
        });
      },
    });
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      width: 332,
      text: mode === "login" ? "signin_with" : "signup_with",
    });
  }, [mode, loginWithGoogle]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && closeAuthModal()}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" ref={dialogRef}>
        <button className={styles.closeBtn} onClick={closeAuthModal} aria-label="Close">
          <X size={20} />
        </button>

        <div className={styles.header}>
          <div className={styles.brandIcon}>
            <TrendingUp size={22} />
          </div>
          <h2 className={styles.title}>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className={styles.subtitle}>
            {mode === "login"
              ? "Log in to access live edge analysis and your bet ledger."
              : "Sign up to start tracking value bets and arbitrage."}
          </p>
        </div>

        {GOOGLE_CLIENT_ID && (
          <>
            <div ref={googleBtnRef} className={styles.googleBtn} />
            <div className={styles.divider}>
              <span>or</span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.fieldRow}>
            <label htmlFor="auth-email">Email</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.fieldIcon} />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <label htmlFor="auth-password">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.fieldIcon} />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "signup" ? 8 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.toggleVisibility}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <div className={styles.switchMode}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button type="button" onClick={() => openAuthModal("signup")}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => openAuthModal("login")}>
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
