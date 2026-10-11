const fs = require('fs');
const path = require('path');

const write = (filePath, content) => {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log(`Created: ${filePath}`);
};

// --- COMPONENTS ---
write('src/components/ui/Button.jsx', `
import { motion } from 'framer-motion';
export function Button({ children, onClick, variant = 'primary', className = '', ...props }) {
  const baseStyle = "px-4 py-2 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5",
    secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
    danger: "bg-red-500 text-white hover:bg-red-600 hover:shadow-red-200 hover:shadow-lg",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300"
  };
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} className={\`\${baseStyle} \${variants[variant]} \${className}\`} {...props}>
      {children}
    </motion.button>
  );
}
`);

write('src/components/ui/Card.jsx', `
export function Card({ children, className = '', hover = false }) {
  return (
    <div className={\`bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm \${hover ? 'hover:shadow-md hover:-translate-y-1 transition-all duration-300' : ''} \${className}\`}>
      {children}
    </div>
  );
}
`);

write('src/components/ui/Badge.jsx', `
export function Badge({ children, status, className = '' }) {
  const colors = {
    CONFIRMED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200",
    CHECKED_IN: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200",
    ONGOING: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200",
    COMPLETED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200",
    AUTO_RELEASED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200",
    DEFAULT: "bg-slate-100 text-slate-700 border-slate-200"
  };
  return (
    <span className={\`px-2.5 py-1 text-xs font-semibold rounded-full border \${colors[status] || colors.DEFAULT} \${className}\`}>
      {children}
    </span>
  );
}
`);

write('src/components/RoomCard.jsx', `
import { Card } from './ui/Card';
import { Users, Star, Monitor } from 'lucide-react';
export function RoomCard({ room, matchScore, reason }) {
  return (
    <Card hover className="p-5 flex flex-col gap-4 overflow-hidden relative h-full">
      {matchScore && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-teal-400 to-indigo-500 text-white px-3 py-1 rounded-bl-xl text-xs font-bold shadow-sm">
          Best Match {matchScore}%
        </div>
      )}
      <div className="flex justify-between items-start mt-2">
        <div>
          <h3 className="text-lg font-bold">{room.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Floor {room.floor}</p>
        </div>
        <div className="flex items-center gap-1 text-amber-500 font-semibold bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
          <Star size={14} fill="currentColor" /> {room.baseScore / 10}
        </div>
      </div>
      {reason && <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg">{reason}</p>}
      <div className="flex flex-wrap gap-2 mt-auto pt-2">
        <span className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300"><Users size={12}/> {room.capacity}</span>
        {room.equipment?.includes(1) && <span className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300"><Monitor size={12}/></span>}
      </div>
    </Card>
  );
}
`);

// --- LAYOUT ---
write('src/layouts/AppLayout.jsx', `
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, LayoutGrid, CheckSquare, Bell, LogOut, MessageSquare, Sun, Moon } from 'lucide-react';
import useStore from '../store/useStore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

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

  if (!user) {
    navigate('/login');
    return null;
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Book Room', path: '/book', icon: CheckSquare },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Rooms', path: '/rooms', icon: LayoutGrid },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-teal-400 mr-3"></div>
          <span className="font-bold text-lg tracking-tight">MeetWithoutMaze</span>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.name} to={item.path} className={\`flex items-center relative gap-3 px-4 py-3 rounded-xl transition-all \${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}\`}>
                <item.icon size={20} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                {item.name}
                {isActive && <motion.div layoutId="nav-pill" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />}
              </Link>
            )
          })}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{role}</p>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} className="text-slate-400 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 z-10 shrink-0">
          <h2 className="text-xl font-bold capitalize">{location.pathname.split('/')[1] || 'Dashboard'}</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </main>
      </div>

      {/* Floating Chatbots Placeholder */}
      <div className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer shadow-violet-300 z-50">
        <MessageSquare size={24} />
      </div>
    </div>
  );
}
`);

// --- PAGES ---
write('src/pages/Login.jsx', `
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { users } from '../mock/seed';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useStore();
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    setLoading(true);
    // Simulate network
    await new Promise(r => setTimeout(r, 600));
    const u = users.find(u => u.role === role);
    login(u, 'mock-jwt-token');
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Left side Hero */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-20 bg-gradient-to-br from-indigo-900 via-violet-800 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="z-10">
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">Stop hunting for rooms.<br/>Start meeting.</h1>
          <p className="text-xl text-indigo-200 max-w-md">Meet Without The Maze is your smart conflict-resolving scheduling assistant.</p>
        </motion.div>
        
        {/* Floating cards animation */}
        <motion.div animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute top-1/4 right-20 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl text-white">
          <p className="text-xs font-bold text-teal-300">CLASH DETECTED</p>
          <p className="text-sm mt-1">Found 3 better rooms at 2:00 PM</p>
        </motion.div>
      </div>

      {/* Right side Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 z-10 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
            <p className="text-slate-500 mt-2">Sign in to your account</p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
            <button onClick={() => setRole('USER')} className={\`flex-1 py-2 text-sm font-semibold rounded-lg transition-all \${role === 'USER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}\`}>User Portal</button>
            <button onClick={() => setRole('OWNER')} className={\`flex-1 py-2 text-sm font-semibold rounded-lg transition-all \${role === 'OWNER' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500'}\`}>Owner Portal</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email address</label>
              <input type="email" value={role === 'USER' ? 'asha@corp.com' : 'admin@corp.com'} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input type="password" value="password123" readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 outline-none" />
            </div>
            <Button onClick={handleDemoLogin} className="w-full py-3 text-lg" variant={role === 'USER' ? 'primary' : 'secondary'} disabled={loading}>
              {loading ? 'Authenticating...' : 'Fill Demo Login & Enter'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

write('src/pages/Dashboard.jsx', `
import { useEffect } from 'react';
import useStore from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../api/apiClient';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user, rooms, meetings, setRooms, setMeetings } = useStore();

  useEffect(() => {
    api.getRooms().then(setRooms);
    api.getMeetings().then(setMeetings);
  }, []);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Good morning, {user.name.split(' ')[0]}!</h1>
        <p className="text-slate-500 mt-1">Here is what's happening with your meetings today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item}>
          <Card className="p-6 bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-none shadow-indigo-200 shadow-xl">
            <h3 className="font-semibold opacity-90">Today's Meetings</h3>
            <p className="text-4xl font-extrabold mt-2">{meetings.length || 0}</p>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="font-semibold text-slate-500">Free Rooms Now</h3>
            <p className="text-4xl font-extrabold mt-2 text-slate-800 dark:text-white">{rooms.filter(r => r.isActive).length}</p>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="font-semibold text-slate-500">System Learned</h3>
            <p className="text-lg font-bold mt-2 text-teal-600">Projector fixed in Orion</p>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <h2 className="text-xl font-bold mb-4">Upcoming Schedule</h2>
        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 font-semibold text-sm">Meeting</th>
                <th className="p-4 font-semibold text-sm">Room</th>
                <th className="p-4 font-semibold text-sm">Time</th>
                <th className="p-4 font-semibold text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {meetings.slice(0, 4).map(m => (
                <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-medium">{m.title || 'Demo Meeting'}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{rooms.find(r => r.id === m.roomId)?.name || 'Room'}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{new Date(m.startTime).toLocaleString()}</td>
                  <td className="p-4"><Badge status={m.status}>{m.status}</Badge></td>
                </tr>
              ))}
              {meetings.length === 0 && (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">No upcoming meetings. Great time for deep work!</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </motion.div>
    </motion.div>
  );
}
`);

write('src/pages/Book.jsx', `
import { useState } from 'react';
import { api } from '../api/apiClient';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RoomCard } from '../components/RoomCard';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import useStore from '../store/useStore';

export default function Book() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ title: 'Design Sync', attendees: 4, date: new Date().toISOString().split('T')[0], startTime: '10:00', endTime: '11:00' });
  const [alternatives, setAlternatives] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [conflict, setConflict] = useState(false);
  
  const { addMeeting, user } = useStore();

  const handleCheck = async () => {
    setIsChecking(true);
    setConflict(false);
    try {
      // Simulate checking - we'll always show conflict in this demo step for the wow factor
      await new Promise(r => setTimeout(r, 800));
      setConflict(true);
      // Fetch alternative rooms
      const rooms = await api.getRooms();
      setAlternatives(rooms.slice(0, 3).map((r, i) => ({...r, matchScore: 98 - (i*5), reason: \`Perfect fit for \${formData.attendees}, free right now.\`})));
      setStep(2);
    } catch (e) {
      console.error(e);
      toast.error("Failed to check availability");
    } finally {
      setIsChecking(false);
    }
  };

  const handleBook = async (roomId) => {
    const meetingData = {
        title: formData.title,
        roomId: roomId,
        startTime: \`\${formData.date}T\${formData.startTime}:00\`,
        endTime: \`\${formData.date}T\${formData.endTime}:00\`,
        attendees: formData.attendees,
        organizerId: user.id
    };
    try {
        const result = await api.bookMeeting(meetingData);
        addMeeting(result);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setStep(3);
    } catch (e) {
        toast.error("Booking failed");
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8 max-w-xl mx-auto">
        <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors \${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}\`}>1</div>
        <div className={\`h-1 flex-1 transition-colors \${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}\`}></div>
        <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors \${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}\`}>2</div>
        <div className={\`h-1 flex-1 transition-colors \${step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}\`}></div>
        <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors \${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}\`}>3</div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Card className="p-8 max-w-2xl mx-auto shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Meeting Details</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Title</label>
                  <input value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Date</label>
                    <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Attendees</label>
                    <input type="number" value={formData.attendees} onChange={e=>setFormData({...formData, attendees: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Start Time</label>
                    <input type="time" value={formData.startTime} onChange={e=>setFormData({...formData, startTime: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">End Time</label>
                    <input type="time" value={formData.endTime} onChange={e=>setFormData({...formData, endTime: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                </div>
                <Button onClick={handleCheck} className="w-full mt-6 py-3 text-lg" disabled={isChecking}>{isChecking ? 'Scanning Availability...' : 'Find the Perfect Room'}</Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            {conflict && (
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                    <h3 className="text-red-800 dark:text-red-400 font-bold text-lg">CLASH DETECTED</h3>
                    <p className="text-red-600 dark:text-red-300 text-sm mt-1 font-medium">Your preferred slot is booked. Mondays at {formData.startTime} are usually 90% full.</p>
                 </div>
                 <Button variant="danger" className="shrink-0" onClick={() => {setFormData({...formData, startTime: '14:00', endTime: '15:00'}); toast.success('Time updated to 2:00 PM');}}>Switch to 2:00 PM</Button>
               </motion.div>
            )}

            <div className="flex items-center justify-between mt-6">
                <div>
                    <h2 className="text-2xl font-bold">Smart Alternatives</h2>
                    <p className="text-slate-500">We found {alternatives.length} perfect matches for {formData.attendees} people right now.</p>
                </div>
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {alternatives.map((r, idx) => (
                 <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="h-full">
                   <div className="h-full flex flex-col">
                       <div className="flex-1">
                          <RoomCard room={r} matchScore={r.matchScore} reason={r.reason} />
                       </div>
                       <Button onClick={() => handleBook(r.id)} className="w-full mt-4 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200">Book {r.name}</Button>
                   </div>
                 </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center text-center">
             <Card className="p-12 max-w-lg w-full flex flex-col items-center shadow-xl">
               <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mb-6 shadow-lg shadow-green-100 animate-bounce">✨</div>
               <h2 className="text-3xl font-extrabold mb-2 text-slate-900 dark:text-white">Meeting Confirmed!</h2>
               <p className="text-slate-500 mb-8 font-medium">Your room is locked. Check in within 15 minutes of the start time or it will auto-release.</p>
               
               <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-8 text-left border border-slate-200 dark:border-slate-700">
                   <p className="font-bold text-lg mb-1">{formData.title}</p>
                   <p className="text-slate-500 text-sm">{formData.date} • {formData.startTime} - {formData.endTime}</p>
                   <p className="text-slate-500 text-sm">Room {alternatives[0]?.name || 'Orion'} • {formData.attendees} attendees</p>
               </div>

               <Button onClick={() => { setStep(1); setConflict(false); }} className="w-full py-3" variant="secondary">Book Another Room</Button>
             </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`);

// --- APP.JSX OVERWRITE ---
write('src/App.jsx', `
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Book from './pages/Book';
import AppLayout from './layouts/AppLayout';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg', duration: 4000 }} />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/book" element={<Book />} />
            <Route path="/calendar" element={<div className="flex items-center justify-center h-full text-slate-500 flex-col gap-4"><div className="text-6xl animate-bounce">📅</div><h2 className="text-2xl font-bold">Calendar View</h2><p>Coming in Step 4</p></div>} />
            <Route path="/rooms" element={<div className="flex items-center justify-center h-full text-slate-500 flex-col gap-4"><div className="text-6xl animate-bounce">🚪</div><h2 className="text-2xl font-bold">Rooms Directory</h2><p>Coming in Step 5</p></div>} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}
export default App;
`);
