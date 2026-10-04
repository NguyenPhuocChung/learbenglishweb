import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Stories from "./pages/Stories";
import Topics from "./pages/Topics";
import Users from "./pages/Users";

function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="stories" element={<Stories />} />
        <Route path="topics" element={<Topics />} />
        <Route path="users" element={<Users />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

export default AdminApp;