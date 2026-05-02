import DrawerLayout from "../../../shared/components/DrawerLayout/DrawerLayout";
import styles from "./LockerTradeDrawer.module.css";

type LockerTradeDrawerProps = {
  onBack: () => void;
};

export default function LockerTradeDrawer({ onBack }: LockerTradeDrawerProps) {
  return (
    <DrawerLayout title="보관함 거래" onBack={onBack}>
      <div className={styles.container}>
        <p className={styles.emptyText}>보관함 거래 설정 화면입니다.</p>
      </div>
    </DrawerLayout>
  );
}
