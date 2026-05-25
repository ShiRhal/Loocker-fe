import { useNavigate } from "react-router-dom";
import logoImage from "../../../assets/images/Loocker.png";
import styles from "../styles/kiosk.module.css";

const menuItems = [
  {
    title: "물품 보관",
    path: "/kiosk/seller/deposit/auth",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect x="14" y="22" width="36" height="30" rx="4" />
        <path d="M22 22v-6a10 10 0 0 1 20 0v6" />
        <path d="M32 34v8" />
        <circle cx="32" cy="32" r="3" />
      </svg>
    ),
  },
  {
    title: "물품 확인",
    path: "/kiosk/check",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect x="12" y="14" width="40" height="36" rx="4" />
        <path d="M22 28h20" />
        <path d="M22 38h12" />
        <circle cx="46" cy="46" r="10" />
        <path d="M52 52l6 6" />
      </svg>
    ),
  },
  {
    title: "물품 수령",
    path: "/kiosk/pickup",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect x="14" y="18" width="36" height="34" rx="4" />
        <path d="M24 18a8 8 0 0 1 16 0" />
        <path d="M32 34v-14" />
        <path d="M24 28l8 8 8-8" />
      </svg>
    ),
  },
  {
    title: "보관 위치 확인",
    path: "/kiosk/location",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 58s18-18 18-34a18 18 0 0 0-36 0c0 16 18 34 18 34z" />
        <circle cx="32" cy="24" r="7" />
        <path d="M10 56h44" />
      </svg>
    ),
  },
];

export default function KioskHomePage() {
  const navigate = useNavigate();

  return (
    <main className={styles.mainPage}>
      <header className={styles.header}>
        <button className={styles.logoButton} type="button">
          <img className={styles.logoImage} src={logoImage} alt="Loocker" />
        </button>

        <button
          className={styles.settingButton}
          type="button"
          onClick={() => navigate("/kiosk/settings")}
          aria-label="설정"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15.5A3.5 3.5 0 1 0 12.9 8.5a3.5 3.5 0 0 0 0 7z" />
            <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65-2-3.46-2.49 1a7.3 7.3 0 0 0-1.7-.98L15 3.25h-4l-.35 2.68a7.3 7.3 0 0 0-1.7.98l-2.49-1-2 3.46 2.11 1.65a7.9 7.9 0 0 0 0 1.96l-2.11 1.65 2 3.46 2.49-1c.52.4 1.09.73 1.7.98l.35 2.68h4l.35-2.68a7.3 7.3 0 0 0 1.7-.98l2.49 1 2-3.46-2.11-1.65z" />
          </svg>
        </button>
      </header>

      <section className={styles.menuSection}>
        {menuItems.map((item) => (
          <button
            key={item.title}
            className={styles.menuCard}
            type="button"
            onClick={() => navigate(item.path)}
          >
            <span className={styles.iconCircle}>
              {item.icon}
              <span className={styles.menuTitle}>{item.title}</span>
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}
