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
          <p className="text-zinc-500 mt-1">See who's where, at a glance.</p>
        </div>
        <div>
           <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800" />
        </div>
      </div>

      <Card className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="w-48 p-4 font-bold border-r border-zinc-200 dark:border-zinc-700 shrink-0">Room</div>
            <div className="flex-1 flex">
              {hours.map(h => (
                <div key={h} className="flex-1 p-4 text-center font-semibold text-sm border-r border-zinc-200 dark:border-zinc-700 last:border-0 shrink-0">
                  {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
                </div>
              ))}
            </div>
          </div>

          {/* Room Rows */}
          {rooms.slice(0, 8).map(room => (
            <div key={room.id} className="flex border-b border-zinc-200 dark:border-zinc-700 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
              <div className="w-48 p-4 border-r border-zinc-200 dark:border-zinc-700 shrink-0">
                <p className="font-bold">{room.name}</p>
                <p className="text-xs text-zinc-500">Cap: {room.capacity}</p>
              </div>
              <div className="flex-1 flex relative">
                 {/* Grid lines */}
                 {hours.map(h => (
                   <div key={h} className="flex-1 border-r border-zinc-200 dark:border-zinc-700/50 last:border-0 shrink-0"></div>
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
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={m.id} className="absolute top-2 bottom-2 rounded-lg bg-rose-500/20 border border-rose-500 text-rose-700 dark:text-rose-300 px-3 py-1 text-xs font-semibold overflow-hidden whitespace-nowrap shadow-sm backdrop-blur-md cursor-pointer hover:bg-rose-500 hover:text-white transition-all z-10" style={{ left: `${left}%`, width: `${width}%`}}>
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
