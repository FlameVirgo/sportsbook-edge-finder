import type { ReactNode } from "react";
import styles from "./Panel.module.css";

interface PanelProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

export default function Panel({ icon, title, children }: PanelProps) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
