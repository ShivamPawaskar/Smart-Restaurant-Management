import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/Badge";
import { getMyOrders } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const TrackOrderPage = () => {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    const { data } = await getMyOrders();
    setOrders(data);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useSocket(token, {
    "order:created": () => loadOrders(),
    "order:updated": () => loadOrders()
  });

  const activeOrder = useMemo(
    () => orders.find((order) => ["pending", "preparing", "ready"].includes(order.status)),
    [orders]
  );

  return (
    <div className="min-h-screen bg-[#0b0d12] px-6 py-6 text-slate-100">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-700 bg-[#10141d] p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Track Order</p>
            <h1 className="text-3xl font-black">Hello, {user?.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold">
              Back to Menu
            </Link>
            <Link to="/customer" className="rounded-lg bg-[#ef4f45] px-4 py-2 text-sm font-semibold text-white">
              Full Dashboard
            </Link>
          </div>
        </header>

        {activeOrder && (
          <section className="mb-6 rounded-2xl border border-slate-700 bg-gradient-to-r from-[#ef4f45] to-[#d93c30] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-100">Live Order</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-black">Order #{activeOrder.id}</h2>
              <Badge status={activeOrder.status} />
            </div>
            <p className="mt-2 text-sm text-rose-100">Current total: {formatINR(activeOrder.totalPrice)}</p>
          </section>
        )}

        <section className="rounded-2xl border border-slate-700 bg-[#10141d] p-4">
          <h2 className="mb-4 text-xl font-bold">Order History</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {orders.length === 0 && <p className="text-slate-400">No orders yet.</p>}
            {orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-slate-700 bg-[#0f131b] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Order #{order.id}</h3>
                  <Badge status={order.status} />
                </div>
                <ul className="space-y-1 text-sm text-slate-300">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.menuItemId}`}>
                      {item.name} x {item.quantity} ({formatINR(item.subtotal)})
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm font-semibold">Bill: {formatINR(order.totalPrice)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TrackOrderPage;
