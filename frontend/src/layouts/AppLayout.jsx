import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, LayoutGrid, CheckSquare, Bell, LogOut, MessageSquare, Sun, Moon, ClipboardList } from 'lucide-react';
import useStore from '../store/useStore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChatBot } from '../components/ChatBot';

export default function AppLayout() {
  const { user, role, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const userNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Book Room', path: '/book', icon: CheckSquare },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Rooms Directory', path: '/rooms', icon: LayoutGrid },
    { name: 'History', path: '/history', icon: ClipboardList },
  ];

  const ownerNavItems = [
    { name: 'Dashboard', path: '/owner/dashboard', icon: Home },
    { name: 'Manage Rooms', path: '/owner/rooms', icon: LayoutGrid },
    { name: 'Room Reviews', path: '/owner/reviews', icon: MessageSquare },
  ];

  const navItems = role === 'OWNER' ? ownerNavItems : userNavItems;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-400 mr-3"></div>
          <span className="font-bold text-lg tracking-tight">MazeOut</span>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.name} to={item.path} className={`flex items-center relative gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-semibold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                <item.icon size={20} className={isActive ? 'text-rose-600 dark:text-rose-400' : ''} />
                {item.name}
                {isActive && <motion.div layoutId="nav-pill" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-rose-600 rounded-r-full" />}
              </Link>
            )
          })}
        </div>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-zinc-500 truncate">{role}</p>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} className="text-zinc-400 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-8 z-10 shrink-0">
          <h2 className="text-xl font-bold capitalize">{location.pathname.split('/')[1] || 'Dashboard'}</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="relative flex items-center justify-between w-16 h-8 px-1 rounded-full bg-zinc-200 dark:bg-zinc-700 transition-colors cursor-pointer shrink-0"
            >
              <span className="z-10 flex items-center justify-center w-6 h-6">
                 <Sun size={14} className={theme === 'light' ? 'text-amber-500' : 'text-zinc-500'} />
              </span>
              <span className="z-10 flex items-center justify-center w-6 h-6">
                 <Moon size={14} className={theme === 'dark' ? 'text-indigo-300' : 'text-zinc-400'} />
              </span>
              <motion.div 
                className="absolute top-1 left-1 w-6 h-6 bg-white dark:bg-zinc-900 rounded-full shadow-sm z-0"
                animate={{ x: theme === 'dark' ? 32 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <button className="relative p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
