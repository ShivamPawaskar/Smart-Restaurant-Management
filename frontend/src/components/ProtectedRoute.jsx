import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length && !roles.includes(user?.role)) {
    const roleHome =
      user?.role === "customer"
        ? "/spice-garden"
        : user?.role === "kitchen"
          ? "/kitchen"
          : "/manager";
    return <Navigate to={roleHome} replace />;
  }

  return children;
};

export default ProtectedRoute;
