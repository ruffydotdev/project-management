import React from "react";
import { Outlet, Navigate } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isInitialLoading } = useSelector(
    (state: RootState) => state.auth
  );

  if (!isInitialLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AuthLayout;
