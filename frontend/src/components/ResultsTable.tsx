import { formatAmerican, pct, signedClass } from "../lib/format";
import type { BookRow } from "../types";
import styles from "./ResultsTable.module.css";

interface ResultsTableProps {
  rows: BookRow[];
}

export default function ResultsTable({ rows }: ResultsTableProps) {
  return (
    <div className={styles.tableContainer}>
      <table>
        <thead>
          <tr>
            <th>Book</th>
            <th>American</th>
            <th>Decimal</th>
            <th>Implied %</th>
            <th>EV</th>
            <th>Edge</th>
            <th>Full Kelly %</th>
            <th>Stake $</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                No analysis run yet.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.book}
                className={
                  index < 3 && row.edge > 0
                    ? styles.bestEdgeRow
                    : row.edge < 0
                      ? styles.negativeEdgeRow
                      : ""
                }
              >
                <td>{row.book}</td>
                <td>{formatAmerican(row.american_odds)}</td>
                <td>{row.decimal_odds.toFixed(3)}</td>
                <td>{pct(row.implied_prob)}</td>
                <td className={signedClass(row.ev)}>{pct(row.ev)}</td>
                <td className={signedClass(row.edge)}>{pct(row.edge)}</td>
                <td>{pct(row.full_kelly_pct)}</td>
                <td>${row.recommended_stake.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
