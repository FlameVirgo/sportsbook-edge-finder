export function pct(x: number): string {
  return (x * 100).toFixed(2) + "%";
}

// Note: these classnames currently have no matching CSS rule (a
// pre-existing no-op carried over from the prior vanilla-JS version) —
// preserved as-is rather than introducing new styling, per "keep the
// same look" for this migration.
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
