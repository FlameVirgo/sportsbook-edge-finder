import styles from "./SportTabs.module.css";

interface SportTabsProps {
  sports: string[];
  selected: string | null;
  onSelect: (sport: string) => void;
}

export default function SportTabs({ sports, selected, onSelect }: SportTabsProps) {
  return (
    <div className={styles.sportTabs}>
      {sports.map((sport) => (
        <button
          key={sport}
          className={`${styles.sportTab} ${sport === selected ? styles.active : ""}`}
          onClick={() => onSelect(sport)}
        >
          {sport}
        </button>
      ))}
    </div>
  );
}
