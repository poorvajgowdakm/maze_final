export function Badge({ children, status, className = '' }) {
  const colors = {
    CONFIRMED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200",
    CHECKED_IN: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200",
    ONGOING: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200",
    COMPLETED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200",
    AUTO_RELEASED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200",
    DEFAULT: "bg-zinc-100 text-zinc-700 border-zinc-200"
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colors[status] || colors.DEFAULT} ${className}`}>
      {children}
    </span>
  );
}
