import { Route } from "react-router";
import AuthLayout from "../components/Layouts/AuthLayout/AuthLayout";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import VerifyEmail from "../pages/VerifyEmail/VerifyEmail";

const AuthRoutes = () => {
  return (
    <Route path="/auth" element={<AuthLayout />}>
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="verify-email" element={<VerifyEmail />} />
    </Route>
  );
};

export default AuthRoutes;
