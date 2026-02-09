import { useMemo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PublicMenuPage from "./pages/PublicMenuPage";
import KitchenDashboard from "./pages/kitchen/KitchenDashboard";
import ManagerDashboard from "./pages/manager/ManagerDashboard";

const App = () => {
  const { user, isAuthenticated } = useAuth();
  const rolePath = useMemo(() => {
    if (!isAuthenticated) return "/login";
    if (user?.role === "kitchen") return "/kitchen";
    if (user?.role === "manager") return "/manager";
    return "/spice-garden";
  }, [isAuthenticated, user?.role]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={rolePath} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/spice-garden"
        element={
          <ProtectedRoute roles={["customer"]}>
            <PublicMenuPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute roles={["kitchen"]}>
            <KitchenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <ProtectedRoute roles={["manager"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={rolePath} replace />} />
    </Routes>
  );
};

export default App;
