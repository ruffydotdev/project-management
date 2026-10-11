import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router";
import type { RootState } from "../../../store";
import { Menu, Bell, Search } from "lucide-react";
import styles from "./Navbar.module.scss";

interface NavbarProps {
  onOpenMobile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobile }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <header className={styles.navbar}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search projects, employees..."
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.rightSection}>
        <button type="button" className={styles.iconBtn} aria-label="Notifications">
          <Bell size={18} />
          <span className={styles.notificationDot} />
        </button>

        <Link to="/profile" className={styles.userBadge} title="View My Profile">
          <div className={styles.avatar}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className={styles.details}>
            <span className={styles.name}>{user?.name}</span>
            <span className={styles.dept}>{user?.department}</span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
