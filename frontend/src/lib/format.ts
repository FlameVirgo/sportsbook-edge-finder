export function pct(x: number): string {
  return (x * 100).toFixed(2) + "%";
}

// Global classes (styled in index.css, not a CSS Module — used as
// plain strings so they apply regardless of which component renders them).
export function signedClass(x: number): string {
  return x >= 0 ? "value-positive" : "value-negative";
}

export function formatAmerican(odds: number): string {
  return (odds > 0 ? "+" : "") + odds;
}

export function formatKickoff(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
