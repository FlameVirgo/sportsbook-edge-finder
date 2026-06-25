import { useState } from "react";
import { getTeamImageUrl } from "../lib/logos";
import styles from "./TeamLogo.module.css";

interface TeamLogoProps {
  name: string;
  sport: string;
}

function initials(name: string): string {
  const words = name.split(" ").filter((w) => w.length > 0);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function TeamLogo({ name, sport }: TeamLogoProps) {
  const url = getTeamImageUrl(name, sport);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <span className={styles.placeholder} aria-hidden="true">
        {initials(name)}
      </span>
    );
  }

  return (
    <img
      className={styles.logo}
      src={url}
      alt={`${name} logo`}
      onError={() => setFailed(true)}
    />
  );
}
