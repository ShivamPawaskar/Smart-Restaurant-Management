const Badge = ({ status }) => {
  const palette = {
    pending: "bg-amber-100 text-amber-700",
    preparing: "bg-sky-100 text-sky-700",
    ready: "bg-emerald-100 text-emerald-700",
    served: "bg-violet-100 text-violet-700",
    paid: "bg-emerald-100 text-emerald-700",
    unpaid: "bg-rose-100 text-rose-700"
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${palette[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
};

export default Badge;
