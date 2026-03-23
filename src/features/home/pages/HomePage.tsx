import RecentViewedSidebar from "../components/RecentViewedSidebar";
import styles from "./HomePage.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <div className={styles.placeholder}>
          Home content area
        </div>
      </section>

      <RecentViewedSidebar items={[]} />
    </div>
  );
}