import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getKitchenOrders, updateKitchenStatus } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";

const KitchenDashboard = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    const { data } = await getKitchenOrders();
    setOrders(data);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useSocket(token, {
    "order:created": () => loadOrders(),
    "order:updated": () => loadOrders()
  });

  const moveNext = async (order) => {
    const next = order.status === "pending" ? "preparing" : "ready";
    await updateKitchenStatus(order.id, next);
    await loadOrders();
  };

  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders]
  );
  const preparingCount = useMemo(
    () => orders.filter((order) => order.status === "preparing").length,
    [orders]
  );

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0b0d12] text-slate-100">
      <header className="border-b border-slate-800/80 bg-[#0b0d12]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ef4f45] text-xl">??</div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Spicy Garden</h1>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Kitchen Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold">
              {user?.name}
            </span>
            <button onClick={signOut} className="rounded-lg bg-[#ef4f45] px-4 py-2 text-sm font-semibold">Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-8">
        <h2 className="mb-6 text-4xl font-black tracking-tight md:text-5xl">Kitchen Orders</h2>

        <div className="mb-8 flex flex-wrap gap-4">
          <div className="rounded-full border border-amber-600/60 bg-amber-900/30 px-6 py-2.5 text-2xl font-black text-amber-200">
            {pendingCount} Pending
          </div>
          <div className="rounded-full border border-sky-600/60 bg-sky-900/30 px-6 py-2.5 text-2xl font-black text-sky-200">
            {preparingCount} Preparing
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-slate-600 bg-[#121720] p-5 shadow-xl">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-3xl font-black">Table #{order.tableNumber || "-"}</h3>
                  <p className="text-xl text-slate-300">{order.customerName}</p>
                  <p className="mt-1 text-sm text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span
                  className={`rounded-full px-4 py-1.5 text-base font-semibold ${
                    order.status === "pending"
                      ? "border border-amber-500 bg-amber-900/30 text-amber-300"
                      : order.status === "preparing"
                        ? "border border-sky-500 bg-sky-900/30 text-sky-300"
                        : "border border-emerald-500 bg-emerald-900/30 text-emerald-300"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <ul className="space-y-2 border-y border-slate-700 py-4 text-xl">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.menuItemId}`}>
                    <span className="font-black text-[#ef4f45]">{item.quantity}x</span> {item.name}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => moveNext(order)}
                disabled={order.status === "ready"}
                className="mt-4 w-full rounded-xl bg-[#ef4f45] py-3 text-lg font-semibold text-white disabled:opacity-50"
              >
                {order.status === "pending" ? "Start Preparing" : order.status === "preparing" ? "Mark Ready" : "Ready"}
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default KitchenDashboard;

