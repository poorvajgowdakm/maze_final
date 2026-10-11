import { motion } from 'framer-motion';
export function Button({ children, onClick, variant = 'primary', className = '', ...props }) {
  const baseStyle = "px-4 py-2 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:shadow-rose-200 hover:shadow-lg hover:-tranzinc-y-0.5",
    secondary: "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700",
    danger: "bg-red-500 text-white hover:bg-red-600 hover:shadow-red-200 hover:shadow-lg",
    ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300"
  };
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </motion.button>
  );
}
