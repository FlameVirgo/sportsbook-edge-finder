import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "#60a5fa" }}
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
        Sportsbook Edge Finder
      </h1>
      <p className={styles.subtitle}>
        Compare live sportsbook odds, de-vig the sharp reference line, and size your stake with
        Kelly — all in real time.
      </p>
    </header>
  );
}
