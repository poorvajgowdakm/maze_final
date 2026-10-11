export function Card({ children, className = '', hover = false }) {
  return (
    <div className={`bg-white dark:bg-zinc-800/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl shadow-sm ${hover ? 'hover:shadow-md hover:-tranzinc-y-1 transition-all duration-300' : ''} ${className}`}>
      {children}
    </div>
  );
}
