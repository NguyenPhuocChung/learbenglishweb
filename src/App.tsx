import { Route, Routes, Navigate, useLocation } from "react-router-dom";

import AdminApp from "./admin/AdminApp";
import Home from "./components/HomePage";
import Stories from "./components/Stories";
import EnghlishStory from "./components/EnglishStory";
import Review from "./components/Review";
import Vocabulary from "./components/Vocabulary";
import Listening from "./components/Listening";
import Speaking from "./components/Speaking";
import Auth from "./components/Auth";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword.jsx";
import { getAuthToken, getStoredAuthUser } from "./services/api";
function App() {
  const location = useLocation();
  const authToken = getAuthToken();
  const authUser = getStoredAuthUser();

  const publicPaths = [
    "/login",
    "/forgot-password",
    "/reset-password",
  ];

  const isPublicPage = publicPaths.includes(location.pathname);

  if (!authToken && !isPublicPage) {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname.startsWith("/admin") && authUser?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />

      {/* LOGIN */}
      <Route path="/login" element={<Auth />} />

      {/* HOME */}
      <Route path="/" element={<Home />} />

      {/* STORIES */}
      <Route path="/stories" element={<Stories />} />

      <Route path="/stories/:slug" element={<EnghlishStory />} />

      {/* REVIEW */}
      <Route
        path="/review"
        element={<Review />}
      />

      {/* VOCABULARY */}
      <Route
        path="/vocabulary"
        element={<Vocabulary />}
      />

      {/* LISTENING */}
      <Route
        path="/listening"
        element={<Listening />}
      />

      {/* SPEAKING */}
      <Route
        path="/speaking"
        element={<Speaking />}
      />

      {/* URL không tồn tại */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
      {/* forgot password */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;