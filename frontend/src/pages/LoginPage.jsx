import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DISHES = [
  "Butter Chicken",
  "Paneer Tikka",
  "Hyderabadi Veg Biryani",
  "Dal Makhani",
  "Chicken Tikka Masala",
  "Kadhai Paneer",
  "Gulab Jamun",
  "Masala Chaas",
  "Garlic Naan",
  "Palak Paneer"
];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [status, setStatus] = useState("");
  const [locked, setLocked] = useState(false);

  const todayDish = useMemo(() => DISHES[new Date().getDate() % DISHES.length], []);
  const options = useMemo(() => {
    const wrong = shuffle(DISHES.filter((dish) => dish !== todayDish)).slice(0, 3);
    return shuffle([todayDish, ...wrong]);
  }, [todayDish, round]);

  const best = Math.max(score, Number(localStorage.getItem("spicy_guess_best") || 0));

  const guessDish = (dish) => {
    if (locked) return;
    const isCorrect = dish === todayDish;
    const nextScore = isCorrect ? score + 1 : score;
    setScore(nextScore);
    setStatus(isCorrect ? "Correct! You guessed today's special." : `Wrong. Today's special is ${todayDish}.`);
    setLocked(true);
    const prevBest = Number(localStorage.getItem("spicy_guess_best") || 0);
    if (nextScore > prevBest) localStorage.setItem("spicy_guess_best", String(nextScore));
  };

  const nextRound = () => {
    setRound((r) => r + 1);
    setStatus("");
    setLocked(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const loggedInUser = await login(form);
      const nextPath =
        loggedInUser.role === "customer"
          ? "/spice-garden"
          : loggedInUser.role === "kitchen"
            ? "/kitchen"
            : "/manager";
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
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
            Heat.
            <br />
            Flavor.
            <br />
            Action.
          </h1>
          <p className="mt-4 max-w-lg text-sm text-slate-300">
            Quick food ordering for customers, live kitchen status, and manager analytics in one place.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-[#0b101a] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Mini Game: Guess Today&apos;s Special</h2>
              <div className="text-xs text-slate-300">Best: {best}</div>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-slate-800 px-3 py-1">Score: {score}</span>
              <button
                type="button"
                onClick={nextRound}
                className="rounded-full bg-[#ef4f45] px-4 py-1.5 font-semibold text-white"
              >
                Next Round
              </button>
            </div>
            <p className="mb-3 text-sm text-slate-300">Pick the dish you think is today&apos;s special.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map((dish) => (
                <button
                  key={`${round}-${dish}`}
                  type="button"
                  disabled={locked}
                  onClick={() => guessDish(dish)}
                  className="rounded-xl border border-slate-700 bg-[#090d15] px-3 py-2 text-left text-sm font-semibold transition hover:border-orange-400 disabled:opacity-70"
                >
                  {dish}
                </button>
              ))}
            </div>
            {status && (
              <p className={`mt-3 text-sm ${status.startsWith("Correct") ? "text-emerald-400" : "text-amber-300"}`}>
                {status}
              </p>
            )}
          </div>
        </section>

        <form
          onSubmit={submit}
          className="w-full space-y-4 rounded-3xl border border-slate-700/70 bg-slate-900/60 p-6 shadow-2xl backdrop-blur"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-orange-300">Spicy Garden Access</p>
          <h2 className="text-4xl font-black">Welcome Back</h2>
          <p className="text-sm text-slate-300">Sign in to continue to your dashboard.</p>

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
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button className="w-full rounded-xl bg-[#ef4f45] py-2.5 text-sm font-bold text-white transition hover:bg-[#ff5d52]">
            Login
          </button>
          <p className="text-sm text-slate-300">
            No account?{" "}
            <Link className="font-semibold text-orange-300 hover:text-orange-200" to="/signup">
              Create one
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default LoginPage;
