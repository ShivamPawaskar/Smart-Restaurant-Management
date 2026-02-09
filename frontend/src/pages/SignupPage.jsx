import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    staffPasscode: ""
  });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.role !== "customer" ? { staffPasscode: form.staffPasscode } : {})
      };
      const createdUser = await signup(payload);
      const nextPath =
        createdUser.role === "customer"
          ? "/spice-garden"
          : createdUser.role === "kitchen"
            ? "/kitchen"
            : "/manager";
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07090f] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(239,79,69,0.28),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.2),transparent_30%),linear-gradient(140deg,#07090f,#0f1421_40%,#0c121d)]" />
      <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#ef4f45]/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />

      <main className="relative mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="rounded-3xl border border-slate-700/70 bg-slate-900/40 p-6 backdrop-blur">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-orange-300">Spicy Garden</p>
          <h1 className="text-5xl font-black leading-none sm:text-6xl">
            Join.
            <br />
            Order.
            <br />
            Enjoy.
          </h1>
          <p className="mt-4 max-w-lg text-sm text-slate-300">
            Create your account to access customer ordering, kitchen operations, or manager control panel.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-[#0b101a] p-4">
            <h2 className="text-lg font-bold">Role Access</h2>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="rounded-xl border border-slate-700 bg-[#090d15] px-3 py-2">
                Customer: browse menu, place order, pay, feedback
              </div>
              <div className="rounded-xl border border-slate-700 bg-[#090d15] px-3 py-2">
                Kitchen: view and process incoming orders
              </div>
              <div className="rounded-xl border border-slate-700 bg-[#090d15] px-3 py-2">
                Manager: analytics, serve flow, payments, waiter calls
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={submit}
          className="w-full space-y-4 rounded-3xl border border-slate-700/70 bg-slate-900/60 p-6 shadow-2xl backdrop-blur"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-orange-300">Spicy Garden Access</p>
          <h2 className="text-4xl font-black">Create Account</h2>
          <p className="text-sm text-slate-300">Register and continue to your dashboard.</p>

          <input
            className="w-full rounded-xl border border-slate-700 bg-[#0b101a] px-3 py-2.5 text-sm outline-none ring-[#ef4f45] focus:ring-2"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            className="w-full rounded-xl border border-slate-700 bg-[#0b101a] px-3 py-2.5 text-sm outline-none ring-[#ef4f45] focus:ring-2"
            placeholder="Email address"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            className="w-full rounded-xl border border-slate-700 bg-[#0b101a] px-3 py-2.5 text-sm outline-none ring-[#ef4f45] focus:ring-2"
            placeholder="Password"
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />

          <select
            className="w-full rounded-xl border border-slate-700 bg-[#0b101a] px-3 py-2.5 text-sm outline-none ring-[#ef4f45] focus:ring-2"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value, staffPasscode: "" }))}
          >
            <option value="customer">Customer</option>
            <option value="kitchen">Kitchen</option>
            <option value="manager">Manager</option>
          </select>

          {form.role !== "customer" && (
            <input
              className="w-full rounded-xl border border-slate-700 bg-[#0b101a] px-3 py-2.5 text-sm outline-none ring-[#ef4f45] focus:ring-2"
              placeholder="Staff passcode"
              type="password"
              value={form.staffPasscode}
              onChange={(e) => setForm((prev) => ({ ...prev, staffPasscode: e.target.value }))}
              required
            />
          )}

          {form.role === "customer" && (
            <p className="text-xs text-slate-400">You can choose your table number after login.</p>
          )}
          {form.role !== "customer" && (
            <p className="text-xs text-slate-400">Kitchen/Manager signup requires staff passcode.</p>
          )}

          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button className="w-full rounded-xl bg-[#ef4f45] py-2.5 text-sm font-bold text-white transition hover:bg-[#ff5d52]">
            Create Account
          </button>
          <p className="text-sm text-slate-300">
            Already have an account?{" "}
            <Link className="font-semibold text-orange-300 hover:text-orange-200" to="/login">
              Login
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default SignupPage;
