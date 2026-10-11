const fs = require('fs');
const path = require('path');

const write = (filePath, content) => {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log(`Created: ${filePath}`);
};

write('src/pages/Calendar.jsx', `
import { useState } from 'react';
import useStore from '../store/useStore';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';

export default function Calendar() {
  const { rooms, meetings } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timeline</h1>
          <p className="text-slate-500 mt-1">See who's where, at a glance.</p>
        </div>
        <div>
           <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
        </div>
      </div>

      <Card className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="w-48 p-4 font-bold border-r border-slate-200 dark:border-slate-700 shrink-0">Room</div>
            <div className="flex-1 flex">
              {hours.map(h => (
                <div key={h} className="flex-1 p-4 text-center font-semibold text-sm border-r border-slate-200 dark:border-slate-700 last:border-0 shrink-0">
                  {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
                </div>
              ))}
            </div>
          </div>

          {/* Room Rows */}
          {rooms.slice(0, 8).map(room => (
            <div key={room.id} className="flex border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="w-48 p-4 border-r border-slate-200 dark:border-slate-700 shrink-0">
                <p className="font-bold">{room.name}</p>
                <p className="text-xs text-slate-500">Cap: {room.capacity}</p>
              </div>
              <div className="flex-1 flex relative">
                 {/* Grid lines */}
                 {hours.map(h => (
                   <div key={h} className="flex-1 border-r border-slate-200 dark:border-slate-700/50 last:border-0 shrink-0"></div>
                 ))}
                 
                 {/* Mock Meetings Overlay */}
                 {meetings.filter(m => m.roomId === room.id).map(m => {
                    const startHour = new Date(m.startTime).getHours();
                    const endHour = new Date(m.endTime).getHours();
                    
                    // Simple calculation for demo purposes
                    if (startHour < 8 || startHour > 17) return null;
                    
                    const left = ((startHour - 8) / 10) * 100;
                    const width = ((endHour - startHour) / 10) * 100;
                    
                    return (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={m.id} className="absolute top-2 bottom-2 rounded-lg bg-indigo-500/20 border border-indigo-500 text-indigo-700 dark:text-indigo-300 px-3 py-1 text-xs font-semibold overflow-hidden whitespace-nowrap shadow-sm backdrop-blur-md cursor-pointer hover:bg-indigo-500 hover:text-white transition-all z-10" style={{ left: \`\${left}%\`, width: \`\${width}%\`}}>
                           {m.title || 'Booked'}
                        </motion.div>
                    )
                 })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
`);

write('src/pages/Rooms.jsx', `
import { useState } from 'react';
import useStore from '../store/useStore';
import { RoomCard } from '../components/RoomCard';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function Rooms() {
  const { rooms } = useStore();
  const [search, setSearch] = useState('');
  const [floor, setFloor] = useState('All');

  const filtered = rooms.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
      const matchFloor = floor === 'All' || r.floor.toString() === floor;
      return matchSearch && matchFloor;
  });

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Room Directory</h1>
          <p className="text-slate-500 mt-1">Browse and filter all available spaces.</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search rooms..." className="pl-10 pr-4 py-2 w-full md:w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
           <select value={floor} onChange={e=>setFloor(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <option value="All">All Floors</option>
              <option value="1">Floor 1</option>
              <option value="2">Floor 2</option>
              <option value="3">Floor 3</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((room, i) => (
           <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="h-full">
               <RoomCard room={room} />
           </motion.div>
        ))}
      </div>
      
      {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500">
             <div className="text-4xl mb-2">🔍</div>
             <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No rooms found</h3>
             <p>Try adjusting your search or filters.</p>
          </div>
      )}
    </div>
  );
}
`);

write('src/App.jsx', `
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Book from './pages/Book';
import Calendar from './pages/Calendar';
import Rooms from './pages/Rooms';
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
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/rooms" element={<Rooms />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}
export default App;
`);
