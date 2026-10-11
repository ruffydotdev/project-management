import { Route } from "react-router";
import AppLayout from "../components/Layouts/AppLayout/AppLayout";
import Home from "../pages/Home/Home";
import Employees from "../pages/Employees/Employees";
import EmployeeDetail from "../pages/EmployeeDetail/EmployeeDetail";
import Projects from "../pages/Projects/Projects";
import ProjectDetail from "../pages/ProjectDetail/ProjectDetail";
import Profile from "../pages/Profile/Profile";

const AppRoutes = () => {
  return (
    <Route path="/" element={<AppLayout />}>
      <Route index element={<Home />} />
      <Route path="projects" element={<Projects />} />
      <Route path="projects/:id" element={<ProjectDetail />} />
      <Route path="employees" element={<Employees />} />
      <Route path="employees/:id" element={<EmployeeDetail />} />
      <Route path="profile" element={<Profile />} />
    </Route>
  );
};

export default AppRoutes;
