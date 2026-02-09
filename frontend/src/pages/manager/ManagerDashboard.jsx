import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAnalytics,
  getFeedback,
  getManagerOrders,
  getPayments,
  getWaiterCalls,
  markServed,
  resolveWaiterCall,
  updatePayment
} from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const getLocalDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MetricCard = ({ label, value, tone = "text-slate-100", active = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-xl border bg-[#121720] p-4 text-left transition ${
      active ? "border-[#ef4f45] shadow-[0_0_0_1px_rgba(239,79,69,0.45)]" : "border-slate-700 hover:border-slate-500"
    }`}
  >
    <p className="text-sm text-slate-400">{label}</p>
    <p className={`mt-2 text-4xl font-black ${tone}`}>{value}</p>
  </button>
);

const statusBadge = (status) => {
  if (status === "ready") return "border border-emerald-500 bg-emerald-900/30 text-emerald-300";
  if (status === "served") return "border border-violet-500 bg-violet-900/30 text-violet-300";
  if (status === "preparing") return "border border-sky-500 bg-sky-900/30 text-sky-300";
  return "border border-amber-500 bg-amber-900/30 text-amber-300";
};

const paymentBadge = (status) =>
  status === "paid"
    ? "border border-emerald-500 bg-emerald-900/30 text-emerald-300"
    : "border border-rose-500 bg-rose-900/30 text-rose-300";

const ManagerDashboard = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState("all");

  const loadAll = async () => {
    const [analyticsRes, ordersRes, paymentsRes, feedbackRes, waiterRes] = await Promise.all([
      getAnalytics(),
      getManagerOrders(),
      getPayments(),
      getFeedback(),
      getWaiterCalls()
    ]);

    setAnalytics(analyticsRes.data);
    setOrders(ordersRes.data);
    setPayments(paymentsRes.data);
    setFeedback(feedbackRes.data);
    setWaiterCalls(waiterRes.data);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useSocket(token, {
    "order:created": () => loadAll(),
    "order:updated": () => loadAll(),
    "waiter:called": () => loadAll(),
    "waiter:updated": () => loadAll(),
    "payment:paid": () => loadAll(),
    "feedback:created": () => loadAll()
  });

  const computedAnalytics = useMemo(() => {
    const localTodayKey = getLocalDateKey();
    const utcTodayKey = new Date().toISOString().slice(0, 10);
    const ordersToday = orders.filter((order) => {
      const orderDate = String(order.createdAt || "").slice(0, 10);
      return orderDate === localTodayKey || orderDate === utcTodayKey;
    });
    const pendingOrders = orders.filter((order) =>
      ["pending", "preparing", "ready"].includes(order.status)
    ).length;
    const completedOrders = orders.filter((order) => order.status === "served").length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

    return {
      totalOrdersToday: ordersToday.length,
      totalRevenue,
      pendingOrders,
      completedOrders,
      totalCustomers: Number(analytics?.totalCustomers || 0)
    };
  }, [orders, analytics?.totalCustomers]);

  const visibleOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const localTodayKey = getLocalDateKey();
    const utcTodayKey = new Date().toISOString().slice(0, 10);
    return orders.filter((order) => {
      const matchStatus = statusFilter === "all" || order.status === statusFilter;
      const orderDate = String(order.createdAt || "").slice(0, 10);
      const matchQuick =
        quickFilter === "all" ||
        (quickFilter === "today" && (orderDate === localTodayKey || orderDate === utcTodayKey)) ||
        (quickFilter === "completed" && order.status === "served") ||
        (quickFilter === "pending" && ["pending", "preparing", "ready"].includes(order.status)) ||
        (quickFilter === "unpaid" && order.paymentStatus === "unpaid");
      const matchSearch =
        !q ||
        String(order.id).includes(q) ||
        (order.customerName || "").toLowerCase().includes(q) ||
        String(order.tableNumber || "").includes(q) ||
        order.items.some((item) => item.name.toLowerCase().includes(q));
      return matchStatus && matchQuick && matchSearch;
    });
  }, [orders, search, statusFilter, quickFilter]);

  const unpaidCount = useMemo(
    () => orders.filter((order) => order.paymentStatus === "unpaid").length,
    [orders]
  );

  const handleServe = async (orderId) => {
    await markServed(orderId);
    await loadAll();
  };

  const markPaid = async (orderId) => {
    await updatePayment(orderId, "paid");
    await loadAll();
  };

  const resolveCall = async (callId) => {
    await resolveWaiterCall(callId);
    await loadAll();
  };

  const exportOrders = () => {
    const lines = ["orderId,customer,table,total,status,payment,time"];
    visibleOrders.forEach((order) => {
      lines.push(
        `${order.id},${order.customerName || ""},${order.tableNumber || ""},${order.totalPrice},${order.status},${order.paymentStatus},${order.createdAt}`
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "manager-orders.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

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
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Manager Dashboard</p>
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
        <h2 className="mb-6 text-5xl font-black">Manager Dashboard</h2>

        {computedAnalytics && (
          <section className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              label="Orders Today"
              value={computedAnalytics.totalOrdersToday}
              active={quickFilter === "today"}
              onClick={() => setQuickFilter("today")}
            />
            <MetricCard
              label="Total Revenue"
              value={formatINR(Number(analytics?.totalRevenue ?? computedAnalytics.totalRevenue))}
              tone="text-emerald-400"
              onClick={() => setQuickFilter("all")}
            />
            <MetricCard
              label="Customers"
              value={computedAnalytics.totalCustomers}
              onClick={() => setQuickFilter("all")}
            />
            <MetricCard
              label="Completed"
              value={computedAnalytics.completedOrders}
              tone="text-emerald-400"
              active={quickFilter === "completed"}
              onClick={() => setQuickFilter("completed")}
            />
            <MetricCard
              label="Pending"
              value={computedAnalytics.pendingOrders}
              tone="text-amber-400"
              active={quickFilter === "pending"}
              onClick={() => setQuickFilter("pending")}
            />
            <MetricCard
              label="Unpaid"
              value={unpaidCount}
              tone="text-rose-400"
              active={quickFilter === "unpaid"}
              onClick={() => setQuickFilter("unpaid")}
            />
          </section>
        )}

        <section className="mb-4 flex flex-wrap gap-2">
          {[
            { key: "all", label: "All Orders" },
            { key: "today", label: "Today" },
            { key: "pending", label: "Pending" },
            { key: "completed", label: "Completed" },
            { key: "unpaid", label: "Unpaid" }
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setQuickFilter(item.key)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                quickFilter === item.key
                  ? "border-[#ef4f45] bg-[#ef4f45]/15 text-[#ff9f98]"
                  : "border-slate-700 bg-[#121720] text-slate-300 hover:border-slate-500"
              }`}
            >
              {item.label}
            </button>
          ))}
        </section>

        <section className="mb-6 grid gap-3 rounded-xl border border-slate-700 bg-[#121720] p-3 md:grid-cols-[1fr_auto_auto]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#0d1219] px-3 py-2 text-sm"
            placeholder="Search by name, order ID, table..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#0d1219] px-3 py-2 text-sm"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
          </select>
          <button onClick={exportOrders} className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-semibold">
            Export
          </button>
        </section>

        <section className="mb-6 overflow-hidden rounded-xl border border-slate-700 bg-[#121720]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-slate-300">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-800 align-top">
                    <td className="px-4 py-4 font-mono">{String(order.id).slice(0, 8)}...</td>
                    <td className="px-4 py-4 text-lg font-semibold">{order.customerName}</td>
                    <td className="px-4 py-4 text-lg font-semibold">#{order.tableNumber || "-"}</td>
                    <td className="px-4 py-4 text-lg">
                      {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                    </td>
                    <td className="px-4 py-4 text-xl font-black">{formatINR(order.totalPrice)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentBadge(order.paymentStatus)}`}>
                        {order.paymentStatus === "paid" ? "UPI" : "UNPAID"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-lg text-slate-300">{new Date(order.createdAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-4 space-x-2">
                      {order.status === "ready" && (
                        <button onClick={() => handleServe(order.id)} className="rounded-lg border border-slate-600 bg-black px-3 py-1 text-sm font-semibold">
                          Served
                        </button>
                      )}
                      {order.paymentStatus === "unpaid" && (
                        <button onClick={() => markPaid(order.id)} className="rounded-lg border border-emerald-700 bg-emerald-900/30 px-3 py-1 text-sm font-semibold text-emerald-300">
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-[#121720] p-4 xl:col-span-2">
            <h3 className="mb-3 text-xl font-bold">Waiter Calls</h3>
            <div className="space-y-2">
              {waiterCalls.length === 0 && <p className="text-slate-400">No waiter calls.</p>}
              {waiterCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between rounded-lg border border-slate-700 p-3">
                  <div>
                    <p className="font-semibold">Table {call.tableNumber} - {call.customerName}</p>
                    <p className="text-sm text-slate-400">{call.message}</p>
                  </div>
                  <button
                    onClick={() => resolveCall(call.id)}
                    disabled={call.status === "resolved"}
                    className="rounded-lg bg-[#ef4f45] px-3 py-1 text-sm font-semibold disabled:opacity-50"
                  >
                    {call.status === "resolved" ? "Resolved" : "Resolve"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#121720] p-4">
            <h3 className="mb-3 text-xl font-bold">Recent Feedback</h3>
            <div className="space-y-2 text-sm">
              {feedback.slice(0, 6).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-slate-700 p-3">
                  <p className="font-semibold">{entry.customerName} ({entry.rating}/5)</p>
                  <p className="text-slate-400">{entry.message}</p>
                </div>
              ))}
              {feedback.length === 0 && <p className="text-slate-400">No feedback yet.</p>}
            </div>

            <h4 className="mb-2 mt-5 text-lg font-bold">Latest Payments</h4>
            <div className="space-y-2 text-sm">
              {payments.slice(0, 6).map((payment) => (
                <div key={payment.id} className="rounded-lg border border-slate-700 p-2">
                  <p className="font-semibold">Order #{payment.orderId}</p>
                  <p className="text-slate-400">{payment.customerName} � {formatINR(payment.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ManagerDashboard;


