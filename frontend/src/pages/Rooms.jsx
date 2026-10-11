import { useState } from 'react';
import useStore from '../store/useStore';
import { RoomCard } from '../components/RoomCard';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

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
          <p className="text-zinc-500 mt-1">Browse and filter all available spaces.</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search rooms..." className="pl-10 pr-4 py-2 w-full md:w-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-rose-500 outline-none" />
           </div>
           <select value={floor} onChange={e=>setFloor(e.target.value)} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <option className="bg-white dark:bg-zinc-800" value="All">All Floors</option>
              <option className="bg-white dark:bg-zinc-800" value="1">Floor 1</option>
              <option className="bg-white dark:bg-zinc-800" value="2">Floor 2</option>
              <option className="bg-white dark:bg-zinc-800" value="3">Floor 3</option>
              <option className="bg-white dark:bg-zinc-800" value="4">Floor 4</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
        {filtered.map((room, i) => (
           <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="h-full">
               <RoomCard room={room} />
           </motion.div>
        ))}
      </div>
      
      {filtered.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
             <div className="text-4xl mb-2">🔍</div>
             <h3 className="text-xl font-bold text-zinc-700 dark:text-zinc-300">No rooms found</h3>
             <p>Try adjusting your search or filters.</p>
          </div>
      )}
    </div>
  );
}
