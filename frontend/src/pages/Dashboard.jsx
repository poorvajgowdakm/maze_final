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
        <p className="text-zinc-500 mt-1">Here is what's happening with your meetings today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item}>
          <Card className="p-6 bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white border-none shadow-rose-200 shadow-xl">
            <h3 className="font-semibold opacity-90">Today's Meetings</h3>
            <p className="text-4xl font-extrabold mt-2">{meetings.length || 0}</p>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="font-semibold text-zinc-500">Free Rooms Now</h3>
            <p className="text-4xl font-extrabold mt-2 text-zinc-800 dark:text-white">{rooms.filter(r => r.isActive).length}</p>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="font-semibold text-zinc-500">System Learned</h3>
            <p className="text-lg font-bold mt-2 text-amber-600">Projector fixed in Orion</p>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <h2 className="text-xl font-bold mb-4">Upcoming Schedule</h2>
        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="p-4 font-semibold text-sm">Meeting</th>
                <th className="p-4 font-semibold text-sm">Room</th>
                <th className="p-4 font-semibold text-sm">Time</th>
                <th className="p-4 font-semibold text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {meetings.slice(0, 4).map(m => (
                <tr key={m.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="p-4 font-medium">{m.title || 'Demo Meeting'}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-300">{rooms.find(r => r.id === m.roomId)?.name || 'Room'}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-300">{new Date(m.startTime).toLocaleString()}</td>
                  <td className="p-4"><Badge status={m.status}>{m.status}</Badge></td>
                </tr>
              ))}
              {meetings.length === 0 && (
                <tr><td colSpan="4" className="p-8 text-center text-zinc-500">No upcoming meetings. Great time for deep work!</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </motion.div>
    </motion.div>
  );
}
