import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DashboardShell = ({ title, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{title}</h1>
            <p className="text-sm text-slate-500">
              {user?.name} ({user?.role})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
};

export default DashboardShell;
