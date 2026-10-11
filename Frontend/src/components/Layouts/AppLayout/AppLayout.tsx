import React, { useState } from "react";
import { Outlet, Navigate } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import Sidebar from "../../Organism/Sidebar/Sidebar";
import Navbar from "../../Organism/Navbar/Navbar";
import styles from "./AppLayout.module.scss";

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isAuthenticated, isInitialLoading } = useSelector(
    (state: RootState) => state.auth
  );

  
  if (isInitialLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className={styles.mainContainer}>
        <Navbar onOpenMobile={() => setMobileSidebarOpen(true)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
