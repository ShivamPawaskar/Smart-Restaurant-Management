import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../components/DashboardShell";
import Badge from "../../components/Badge";
import {
  callWaiter,
  createOrder,
  getMenu,
  getMyOrders,
  payMyOrder,
  submitFeedback,
  updateMyTableNumber
} from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const NON_VEG_KEYWORDS = ["chicken", "mutton", "fish", "prawn", "egg", "keema"];
const getDietType = (item) => {
  const text = `${item.name} ${item.description}`.toLowerCase();
  return NON_VEG_KEYWORDS.some((keyword) => text.includes(keyword)) ? "non-veg" : "veg";
};
const toMenuImageName = (name = "") =>
  String(name)
    .toLowerCase()
    .replaceAll("&", "and")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

const getCardImage = (item) => {
  const localByName = `/menu/${toMenuImageName(item?.name)}.jpg`;
  if (item?.imageUrl && !String(item.imageUrl).includes("source.unsplash.com")) {
    return item.imageUrl;
  }
  return localByName;
};

const CustomerDashboard = () => {
  const { token, user, updateUser } = useAuth();
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [feedback, setFeedback] = useState({ message: "", rating: 5 });
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [waiterMessage, setWaiterMessage] = useState("Need assistance at table");
  const [tableNumberInput, setTableNumberInput] = useState(user?.tableNumber || "");
  const [tableSaving, setTableSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadMenu = async () => {
    const { data } = await getMenu();
    setMenu(data);
  };

  const loadOrders = async () => {
    const { data } = await getMyOrders();
    setOrders(data);
  };

  useEffect(() => {
    loadMenu();
    loadOrders();
  }, []);

  useSocket(token, {
    "order:updated": () => loadOrders(),
    "order:created": () => loadOrders(),
    "waiter:updated": () => setStatusMessage("Manager responded to your waiter call.")
  });

  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((p) => p.menuItemId === item.id);
      if (found) {
        return prev.map((p) =>
          p.menuItemId === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  };

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart]
  );

  const placeOrder = async () => {
    if (!cart.length) return;
    if (!user?.tableNumber) {
      setStatusMessage("Please select your table number first.");
      return;
    }

    await createOrder({
      items: cart.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity }))
    });
    setCart([]);
    setStatusMessage("Order placed successfully.");
    await loadOrders();
  };

  const submitFeedbackForm = async (e) => {
    e.preventDefault();
    await submitFeedback({ message: feedback.message, rating: Number(feedback.rating) });
    setFeedback({ message: "", rating: 5 });
    setFeedbackMessage("Feedback submitted");
  };

  const saveTableNumber = async () => {
    setTableSaving(true);
    try {
      const { data } = await updateMyTableNumber(Number(tableNumberInput));
      updateUser(data);
      setStatusMessage(`Table number set to ${data.tableNumber}.`);
    } finally {
      setTableSaving(false);
    }
  };

  const callWaiterNow = async () => {
    await callWaiter(waiterMessage);
    setStatusMessage("Waiter called. Manager has been notified.");
  };

  const payNow = async (orderId) => {
    await payMyOrder(orderId);
    setStatusMessage("Payment successful. Manager has been notified automatically.");
    await loadOrders();
  };

  return (
    <DashboardShell title="Customer Dashboard">
      <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
        <h2 className="text-lg font-bold text-orange-900">Table Setup</h2>
        <p className="mb-3 text-sm text-orange-800">
          Current table: {user?.tableNumber || "Not selected"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min="1"
            className="w-36 rounded border border-orange-300 p-2"
            value={tableNumberInput}
            onChange={(e) => setTableNumberInput(e.target.value)}
            placeholder="Table no."
          />
          <button
            onClick={saveTableNumber}
            disabled={!tableNumberInput || tableSaving}
            className="rounded bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Save Table Number
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 rounded-2xl bg-white p-4 shadow lg:col-span-2">
          <h2 className="text-lg font-semibold">Digital Menu</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {menu.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border">
                <img
                  src={getCardImage(item)}
                  alt={item.name}
                  className="h-36 w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/menu-placeholder.svg";
                  }}
                />
                <div className="space-y-2 p-3">
                  <h3 className="font-semibold">{item.name}</h3>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      getDietType(item) === "veg"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {getDietType(item) === "veg" ? "Veg" : "Non-Veg"}
                  </span>
                  <p className="text-sm text-slate-600">{item.description}</p>
                  <p className="font-bold">{formatINR(item.price)}</p>
                  <button onClick={() => addToCart(item)} className="rounded bg-brand-700 px-3 py-1 text-sm font-semibold text-white">
                    Add to Cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-4 shadow">
          <h2 className="text-lg font-semibold">Cart</h2>
          {cart.map((item) => (
            <div key={item.menuItemId} className="flex items-center justify-between text-sm">
              <span>
                {item.name} x {item.quantity}
              </span>
              <div className="space-x-2">
                <span>{formatINR(item.price * item.quantity)}</span>
                <button className="text-rose-600" onClick={() => removeFromCart(item.menuItemId)}>remove</button>
              </div>
            </div>
          ))}
          <p className="border-t pt-2 font-bold">Total: {formatINR(total)}</p>
          <button onClick={placeOrder} className="w-full rounded bg-emerald-600 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={!cart.length}>
            Place Order
          </button>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">Order History & Bill</h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border p-3 text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">Order #{order.id}</span>
                  <Badge status={order.status} />
                </div>
                <ul className="space-y-1 text-slate-600">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.menuItemId}`}>
                      {item.name} x {item.quantity} ({formatINR(item.subtotal)})
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold">Bill: {formatINR(order.totalPrice)}</p>
                {order.status === "served" && order.paymentStatus === "unpaid" && (
                  <button
                    onClick={() => payNow(order.id)}
                    className="mt-2 rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Pay Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 rounded-2xl bg-white p-4 shadow">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Call Waiter</h2>
            <textarea
              className="w-full rounded border p-2"
              rows="3"
              value={waiterMessage}
              onChange={(e) => setWaiterMessage(e.target.value)}
            />
            <button onClick={callWaiterNow} className="mt-2 rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
              Notify Manager
            </button>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Feedback</h2>
            <form className="space-y-3" onSubmit={submitFeedbackForm}>
              <textarea
                className="w-full rounded border p-2"
                rows="4"
                placeholder="Write feedback"
                value={feedback.message}
                onChange={(e) => setFeedback((prev) => ({ ...prev, message: e.target.value }))}
                required
              />
              <select
                className="w-full rounded border p-2"
                value={feedback.rating}
                onChange={(e) => setFeedback((prev) => ({ ...prev, rating: e.target.value }))}
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} Star
                  </option>
                ))}
              </select>
              <button className="rounded bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Submit</button>
            </form>
          </div>

          {(feedbackMessage || statusMessage) && (
            <p className="text-sm text-emerald-600">{feedbackMessage || statusMessage}</p>
          )}
        </section>
      </div>
    </DashboardShell>
  );
};

export default CustomerDashboard;
