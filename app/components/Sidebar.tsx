import Link from 'next/link';
import { Home, BookOpen, Settings, LogOut } from 'lucide-react';
import styles from '../styles/StartNow.module.css';

const Sidebar = () => {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarHeader}>StudyGuide</div>
      <Link href="/dashboard">
        <a className={`${styles.navLink} ${styles.active}`}>
          <Home size={20} /> Home
        </a>
      </Link>
      <Link href="/my-outlines">
        <a className={styles.navLink}>
          <BookOpen size={20} /> My Outlines
        </a>
      </Link>
      <Link href="/settings">
        <a className={styles.navLink}>
          <Settings size={20} /> Settings
        </a>
      </Link>
      <div className={styles.spacer}></div>
      <Link href="/logout">
        <a className={`${styles.navLink} ${styles.logout}`}>
          <LogOut size={20} /> Logout
        </a>
      </Link>
    </nav>
  );
};

export default Sidebar;
