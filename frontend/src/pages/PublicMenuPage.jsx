import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  callWaiter,
  createOrder,
  getMenu,
  getMyOrders,
  payMyOrder,
  submitFeedback,
  updateMyTableNumber
} from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import Badge from "../components/Badge";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const NON_VEG_KEYWORDS = ["chicken", "mutton", "fish", "prawn", "egg", "keema"];
const SPICY_KEYWORDS = ["spicy", "chilli", "masala", "kadhai", "tandoori", "schezwan", "pepper"];
const MEDIUM_KEYWORDS = ["tikka", "biryani", "kebab", "chatpata", "achari"];

const getDietType = (item) => {
  const text = `${item.name} ${item.description}`.toLowerCase();
  return NON_VEG_KEYWORDS.some((keyword) => text.includes(keyword)) ? "non-veg" : "veg";
};

const getSpiceLevel = (item) => {
  const text = `${item.name} ${item.description}`.toLowerCase();
  if (SPICY_KEYWORDS.some((keyword) => text.includes(keyword))) return "spicy";
  if (MEDIUM_KEYWORDS.some((keyword) => text.includes(keyword))) return "medium";
  return "mild";
};

const getRating = (item) => Number(Math.min(4.9, 3.8 + ((item.id % 12) * 0.1)).toFixed(1));
const getPopularity = (item) => 50 + ((item.id * 7) % 50);
const toMenuImageName = (name = "") =>
  String(name)
    .toLowerCase()
    .replaceAll("&", "and")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

const getCardImage = (item) => {
  // Prefer deterministic local images so external/random URLs are removed.
  const localByName = `/menu/${toMenuImageName(item?.name)}.jpg`;
  if (item?.imageUrl && !String(item.imageUrl).includes("source.unsplash.com")) {
    return item.imageUrl;
  }
  return localByName;
};
const TABLE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const Stars = ({ rating }) => {
  return (
    <div className="rounded-full border border-amber-600/60 bg-amber-900/20 px-2 py-1 text-xs font-semibold text-amber-300">
      Rating {rating}
    </div>
  );
};

const RatingInput = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => {
      const active = star <= Number(value || 0);
      return (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="rounded p-1 transition hover:scale-105"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-6 w-6 ${active ? "text-amber-400" : "text-slate-500"}`}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2.5l2.9 5.88 6.5.95-4.7 4.58 1.1 6.48L12 17.3l-5.8 3.09 1.1-6.48L2.6 9.33l6.5-.95L12 2.5z" />
          </svg>
        </button>
      );
    })}
    <span className="ml-2 text-xs font-semibold text-slate-300">{Number(value || 0)}/5</span>
  </div>
);

const PublicMenuPage = () => {
  const { token, user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [dietFilter, setDietFilter] = useState("all");
  const [spiceFilter, setSpiceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [showTablePicker, setShowTablePicker] = useState(user?.role === "customer");
  const [tableSaving, setTableSaving] = useState(false);
  const [waiterMessage, setWaiterMessage] = useState("Need assistance at table");
  const [feedback, setFeedback] = useState({ message: "", rating: 5 });
  const [payingOrder, setPayingOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [latestReceipt, setLatestReceipt] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [autoPromptedOrders, setAutoPromptedOrders] = useState([]);

  useEffect(() => {
    const loadMenu = async () => {
      const { data } = await getMenu();
      setMenu(data);
    };
    loadMenu();
  }, []);

  const loadOrders = async () => {
    if (user?.role === "customer") {
      const { data } = await getMyOrders();
      setOrders(data);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === "customer") {
      setShowTablePicker(true);
    }
  }, [user?.role]);

  useSocket(token, {
    "order:created": () => loadOrders(),
    "order:updated": () => loadOrders(),
    "payment:paid": () => setMessage("Payment received and manager notified."),
    "waiter:updated": () => setMessage("Manager responded to your waiter request.")
  });

  const categories = useMemo(
    () => ["All", ...new Set(menu.map((item) => item.category || "Specials"))],
    [menu]
  );

  const todaysSpecial = useMemo(() => {
    if (!menu.length) return [];
    const sorted = [...menu].sort((a, b) => getPopularity(b) - getPopularity(a));
    const dayOffset = new Date().getDate() % sorted.length;
    return [0, 1, 2].map((index) => sorted[(dayOffset + index) % sorted.length]);
  }, [menu]);

  const filteredMenu = useMemo(() => {
    const base = menu.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      const matchesDiet = dietFilter === "all" || getDietType(item) === dietFilter;
      const matchesSpice = spiceFilter === "all" || getSpiceLevel(item) === spiceFilter;
      return matchesCategory && matchesSearch && matchesDiet && matchesSpice;
    });

    return [...base].sort((a, b) => {
      if (sortBy === "price-low") return Number(a.price) - Number(b.price);
      if (sortBy === "price-high") return Number(b.price) - Number(a.price);
      if (sortBy === "rating") return getRating(b) - getRating(a);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return getPopularity(b) - getPopularity(a);
    });
  }, [menu, activeCategory, search, dietFilter, spiceFilter, sortBy]);

  const addToCart = (item) => {
    if (user?.role !== "customer") {
      setMessage("Only customer accounts can place orders.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((entry) => entry.menuItemId === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.menuItemId === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: Number(item.price), quantity: 1 }];
    });
  };

  const increaseQuantity = (menuItemId) => {
    setCart((prev) =>
      prev.map((item) =>
        item.menuItemId === menuItemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (menuItemId) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  };

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [cart]
  );

  const hasPaidOrder = useMemo(
    () => orders.some((order) => order.paymentStatus === "paid"),
    [orders]
  );

  useEffect(() => {
    if (user?.role !== "customer" || payingOrder) return;
    const servedUnpaid = orders.find(
      (order) => order.status === "served" && order.paymentStatus === "unpaid"
    );
    if (!servedUnpaid) return;
    if (autoPromptedOrders.includes(servedUnpaid.id)) return;

    setPayingOrder(servedUnpaid);
    setAutoPromptedOrders((prev) => [...prev, servedUnpaid.id]);
  }, [orders, user?.role, payingOrder, autoPromptedOrders]);

  const placeOrder = async () => {
    if (user?.role !== "customer") {
      setMessage("Only customer accounts can place orders.");
      return;
    }

    if (!user?.tableNumber) {
      setMessage("Set your table number before placing an order.");
      return;
    }

    if (!cart.length) return;

    await createOrder({
      items: cart.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity }))
    });
    setCart([]);
    setMessage("Order placed. Track status below.");
  };

  const saveTableNumber = async (tableNumber) => {
    if (user?.role !== "customer" || tableSaving) return;
    setTableSaving(true);
    try {
      const { data } = await updateMyTableNumber(Number(tableNumber));
      updateUser(data);
      setShowTablePicker(false);
      setMessage(`Table number set to ${data.tableNumber}.`);
    } finally {
      setTableSaving(false);
    }
  };

  const callWaiterNow = async () => {
    if (user?.role !== "customer") return;
    await callWaiter(waiterMessage);
    setMessage("Waiter called. Manager notified.");
  };

  const payNow = async () => {
    if (!payingOrder) return;
    const { data } = await payMyOrder(payingOrder.id, paymentMethod);
    setLatestReceipt(data.receipt || null);
    setPayingOrder(null);
    setPaymentMethod("upi");
    setMessage(`Payment successful via ${paymentMethod.toUpperCase()}. Manager notified automatically.`);
    await loadOrders();
  };

  const sendFeedback = async (e) => {
    e.preventDefault();
    await submitFeedback({ message: feedback.message, rating: Number(feedback.rating) });
    setFeedback({ message: "", rating: 5 });
    setMessage("Feedback submitted.");
  };

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0b0d12] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#0b0d12]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ef4f45] text-sm font-black">SG</div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Spicy Garden</h1>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Restaurant Menu</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold">
              {user?.name} ({user?.role})
            </div>
            <button onClick={signOut} className="rounded-xl bg-[#ef4f45] px-4 py-2 text-sm font-semibold text-white">Logout</button>
            {user?.role === "customer" && (
              <button
                onClick={() => setCartOpen(true)}
                className="rounded-xl border border-slate-700 bg-[#10141d] px-4 py-2 text-sm font-semibold text-slate-100"
              >
                Cart ({cart.length})
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1760px] px-6 pb-10 pt-6">
        {user?.role === "customer" && (
          <section className="mb-6 grid gap-3 rounded-2xl border border-slate-700 bg-[#10141d] p-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs uppercase text-slate-400">Table Number</p>
              <div className="grid grid-cols-5 gap-2">
                {TABLE_OPTIONS.map((tableNo) => (
                  <button
                    key={tableNo}
                    type="button"
                    disabled={tableSaving}
                    onClick={() => saveTableNumber(tableNo)}
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                      Number(user?.tableNumber) === tableNo
                        ? "border-[#ef4f45] bg-[#ef4f45]/20 text-[#ff9f98]"
                        : "border-slate-700 bg-[#0b0f17] text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    {tableNo}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase text-slate-400">Call Waiter</p>
              <input
                value={waiterMessage}
                onChange={(e) => setWaiterMessage(e.target.value)}
                className="mb-2 w-full rounded-lg border border-slate-700 bg-[#0b0f17] px-3 py-2 text-sm"
                placeholder="Need assistance at table"
              />
              <button onClick={callWaiterNow} className="w-full rounded-lg border border-slate-700 bg-[#0b0f17] px-3 py-2 text-sm">Notify Manager</button>
            </div>
          </section>
        )}

        <section className="mb-6 rounded-2xl border border-slate-800 bg-[#10141d] p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <input
              className="rounded-xl border border-slate-700 bg-[#0b0f17] px-4 py-2.5 text-sm text-slate-100 outline-none"
              placeholder="Search butter chicken, biryani, paneer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={dietFilter} onChange={(e) => setDietFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-[#0b0f17] px-3 py-2 text-sm">
              <option value="all">All Diets</option>
              <option value="veg">Veg</option>
              <option value="non-veg">Non-Veg</option>
            </select>
            <select value={spiceFilter} onChange={(e) => setSpiceFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-[#0b0f17] px-3 py-2 text-sm">
              <option value="all">All Spice</option>
              <option value="mild">Mild</option>
              <option value="medium">Medium</option>
              <option value="spicy">Spicy</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-slate-700 bg-[#0b0f17] px-3 py-2 text-sm">
              <option value="popular">Popular</option>
              <option value="rating">Top Rated</option>
              <option value="price-low">Price Low</option>
              <option value="price-high">Price High</option>
              <option value="name">Name A-Z</option>
            </select>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
                setDietFilter("all");
                setSpiceFilter("all");
                setSortBy("popular");
              }}
              className="rounded-xl bg-[#ef4f45] px-4 py-2 text-sm font-semibold text-white"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-700 bg-[#10141d] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">Today&apos;s Special</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Chef Curated</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {todaysSpecial.map((item) => (
              <article key={`special-${item.id}`} className="overflow-hidden rounded-xl border border-slate-700 bg-[#0b0f17]">
                <img
                  src={getCardImage(item)}
                  alt={item.name}
                  className="h-40 w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/menu-placeholder.svg";
                  }}
                />
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold">{item.name}</h3>
                    <p className="text-base font-black text-[#ef4f45]">{formatINR(item.price)}</p>
                  </div>
                  <Stars rating={getRating(item)} />
                  <button onClick={() => addToCart(item)} className="w-full rounded-lg bg-[#ef4f45] py-2 text-sm font-semibold text-white">
                    Add Special
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <nav className="mb-5 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeCategory === category
                  ? "bg-[#ef4f45] text-white"
                  : "bg-[#10141d] text-slate-300 ring-1 ring-slate-700"
              }`}
            >
              {category}
            </button>
          ))}
        </nav>

        <div>
          <section className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {filteredMenu.map((item) => (
              <article key={item.id} className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#10141d] shadow-lg">
                <img
                  src={getCardImage(item)}
                  alt={item.name}
                  className="aspect-square w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/menu-placeholder.svg";
                  }}
                />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="min-h-[108px]">
                    <h3 className="break-words text-2xl font-black leading-tight">{item.name}</h3>
                    <span className="mt-2 inline-block text-2xl font-black text-[#ef4f45]">{formatINR(item.price)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-1 font-semibold ${getDietType(item) === "veg" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {getDietType(item) === "veg" ? "Veg" : "Non-Veg"}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">{getSpiceLevel(item)}</span>
                    <Stars rating={getRating(item)} />
                  </div>
                  <p className="min-h-[64px] text-base leading-7 text-slate-300">{item.description}</p>
                  <button onClick={() => addToCart(item)} className="mt-auto w-full rounded-lg bg-[#ef4f45] py-3 text-lg font-semibold text-white">
                    + Add to Order
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>

      {user?.role === "customer" && cartOpen && (
        <div className="fixed inset-0 z-40">
          <button className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} aria-label="Close cart panel" />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[460px] overflow-auto border-l border-slate-700 bg-[linear-gradient(180deg,#121a2a,#10141d)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-black">Your Cart</h3>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                  {cart.length} items
                </span>
                <button onClick={() => setCartOpen(false)} className="rounded-lg border border-slate-700 px-3 py-1 text-sm">Close</button>
              </div>
            </div>

            <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-slate-700 bg-[#0d1220] p-3 text-sm">
              {cart.length === 0 && <p className="text-slate-400">No items added yet.</p>}
              {cart.map((item) => (
                <div key={item.menuItemId} className="rounded-lg border border-slate-700/80 bg-[#0a0f1b] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="max-w-[65%] text-sm font-semibold leading-5">{item.name}</span>
                    <span className="text-sm font-bold text-[#ff9f98]">{formatINR(item.quantity * item.price)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.menuItemId)}
                        className="rounded-md border border-slate-600 px-2 py-1 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.menuItemId)}
                        className="rounded-md border border-slate-600 px-2 py-1 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="rounded-md border border-rose-700 bg-rose-900/20 px-2 py-1 text-xs font-semibold text-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-700 bg-[#0d1220] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cart Total</p>
              <p className="mt-1 text-3xl font-black text-slate-100">{formatINR(total)}</p>
            </div>

            <button
              onClick={placeOrder}
              disabled={!cart.length}
              className="mt-3 w-full rounded-xl bg-[#ef4f45] py-3 text-base font-bold text-white transition hover:bg-[#ff5d52] disabled:opacity-50"
            >
              Place Order
            </button>
            {message && <p className="mt-2 rounded-lg border border-slate-700 bg-[#0d1220] p-2 text-xs text-slate-300">{message}</p>}

            <div className="mt-6 border-t border-slate-700 pt-4">
              <h4 className="mb-2 text-lg font-bold">Track Orders</h4>
              <div className="max-h-72 space-y-2 overflow-auto text-xs">
                {orders.length === 0 && <p className="text-slate-400">No orders yet.</p>}
                {orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-700 bg-[#0d1220] p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-bold">Order #{order.id}</span>
                      <Badge status={order.status} />
                    </div>
                    <p className="mb-1 text-sm text-slate-300">{formatINR(order.totalPrice)}</p>
                    {order.status === "served" && order.paymentStatus === "unpaid" && (
                      <button onClick={() => setPayingOrder(order)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Pay Now</button>
                    )}
                  </div>
                ))}
              </div>

              {latestReceipt && (
                <div className="mt-3 rounded-xl border border-emerald-700 bg-emerald-950/40 p-3 text-xs">
                  <p className="text-base font-bold text-emerald-300">Receipt</p>
                  <p>Receipt No: #{latestReceipt.receiptNo}</p>
                  <p>Order: #{latestReceipt.orderId}</p>
                  <p>Amount: {formatINR(latestReceipt.amount)}</p>
                  <p>Method: {String(latestReceipt.paymentMethod || "").toUpperCase()}</p>
                  <p>Time: {new Date(latestReceipt.paidAt).toLocaleString()}</p>
                  <p className="mt-1 font-semibold text-emerald-300">Status: PAID</p>
                </div>
              )}

              <div className="mt-4 border-t border-slate-700 pt-4">
                <h4 className="mb-2 text-lg font-bold">Post-Payment Feedback</h4>
                {!hasPaidOrder && <p className="text-xs text-slate-400">Pay at least one order to unlock feedback.</p>}
                {hasPaidOrder && (
                  <form onSubmit={sendFeedback} className="space-y-2">
                    <input
                      value={feedback.message}
                      onChange={(e) => setFeedback((prev) => ({ ...prev, message: e.target.value }))}
                      className="w-full rounded-lg border border-slate-700 bg-[#0b0f17] px-3 py-2 text-xs"
                      placeholder="Share your dining experience"
                      required
                    />
                    <div className="flex items-center justify-between gap-2">
                      <RatingInput
                        value={feedback.rating}
                        onChange={(rating) => setFeedback((prev) => ({ ...prev, rating }))}
                      />
                      <button className="rounded-xl bg-[#ef4f45] px-4 py-2 text-sm font-semibold">Send Feedback</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {payingOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#10141d] p-5 shadow-2xl">
            <h3 className="text-xl font-bold">Pay Bill</h3>
            <p className="mt-1 text-sm text-slate-400">Order #{payingOrder.id}</p>
            <p className="mb-4 text-lg font-black text-emerald-400">{formatINR(payingOrder.totalPrice)}</p>

            <div className="space-y-2">
              {[
                { value: "upi", label: "UPI" },
                { value: "card", label: "Card" },
                { value: "cash", label: "Cash" }
              ].map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-700 bg-[#0b0f17] px-3 py-2 text-sm">
                  <span>{option.label}</span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={() => setPayingOrder(null)} className="w-full rounded-lg border border-slate-600 py-2 text-sm font-semibold">
                Pay Later
              </button>
              <button onClick={payNow} className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white">
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {user?.role === "customer" && showTablePicker && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#10141d] p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-3xl font-black">Select Your Table</h3>
                <p className="mt-1 text-slate-400">
                  Choose your table number to continue.
                  {user?.tableNumber ? ` Current: #${user.tableNumber}.` : ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {TABLE_OPTIONS.map((tableNo) => (
                <button
                  key={`modal-table-${tableNo}`}
                  type="button"
                  disabled={tableSaving}
                  onClick={() => saveTableNumber(tableNo)}
                  className="rounded-lg border border-slate-700 bg-[#0b0f17] px-3 py-4 text-2xl font-black text-slate-100 hover:border-[#ef4f45]"
                >
                  {tableNo}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMenuPage;

