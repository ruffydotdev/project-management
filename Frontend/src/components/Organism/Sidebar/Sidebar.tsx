import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../store";
import { logoutUser } from "../../../store/slice/auth/authSlice";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import styles from "./Sidebar.module.scss";

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/auth/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: "Projects",
      path: "/projects",
      icon: <Briefcase size={18} />,
    },
    {
      label: "Employees",
      path: "/employees",
      icon: <Users size={18} />,
    },
    {
      label: "My Profile",
      path: "/profile",
      icon: <UserCircle size={18} />,
    },
  ];

  return (
    <>
      {isMobileOpen && <div className={styles.backdrop} onClick={onCloseMobile} />}
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${
          isMobileOpen ? styles.mobileOpen : ""
        }`}
      >
        <div className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.logoMark} />
            {!collapsed && <span className={styles.brandName}>EMPMS</span>}
          </div>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ""}`
              }
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userProfile} title={user?.name}>
            <div className={styles.avatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            {!collapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.name}</span>
                <span className={styles.userRole}>
                  <Shield size={10} />
                  {user?.role?.replace("_", " ")}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
