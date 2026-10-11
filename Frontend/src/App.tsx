import { useEffect } from "react";
import { BrowserRouter, Routes } from "react-router";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./store";
import { checkAuth } from "./store/slice/auth/authSlice";
import AppRoutes from "./routes/AppRoutes";
import AuthRoutes from "./routes/AuthRoutes";
import "./styles/global/index.scss";

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Attempt session restoration on application startup
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {AuthRoutes()}
        {AppRoutes()}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
