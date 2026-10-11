import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import useStore from '../../store/useStore';
import { rooms as seedRooms, equipmentList } from '../../mock/seed';
import { DollarSign, Users, BarChart3, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';

export default function OwnerDashboard() {
  const { user } = useStore();
  const activeRooms = seedRooms.filter(r => r.isActive).length;
  const totalCapacity = seedRooms.reduce((s, r) => s + r.capacity, 0);
  const paidRooms = seedRooms.filter(r => r.pricingType !== 'FREE').length;

  const stats = [
    { label: 'Total Rooms', value: seedRooms.length, icon: Building2, color: 'rose' },
    { label: 'Active Rooms', value: activeRooms, icon: TrendingUp, color: 'emerald' },
    { label: 'Total Capacity', value: totalCapacity, icon: Users, color: 'amber' },
    { label: 'Paid Rooms', value: paidRooms, icon: DollarSign, color: 'fuchsia' },
  ];

  const colorMap = {
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
    fuchsia: 'bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-zinc-500 mt-1">Here's an overview of your property.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 font-medium">{s.label}</p>
                  <p className="text-3xl font-extrabold mt-1">{s.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[s.color]}`}>
                  <s.icon size={22} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Rooms at a glance */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Rooms Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="py-3 px-4 font-semibold text-zinc-500">Room</th>
                <th className="py-3 px-4 font-semibold text-zinc-500">Floor</th>
                <th className="py-3 px-4 font-semibold text-zinc-500">Capacity</th>
                <th className="py-3 px-4 font-semibold text-zinc-500">Pricing</th>
                <th className="py-3 px-4 font-semibold text-zinc-500">Equipment</th>
                <th className="py-3 px-4 font-semibold text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {seedRooms.map(room => (
                <tr key={room.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold">{room.name}</td>
                  <td className="py-3 px-4 text-zinc-500">Floor {room.floor}</td>
                  <td className="py-3 px-4">{room.capacity} people</td>
                  <td className="py-3 px-4">
                    {room.pricingType === 'FREE' && <span className="text-emerald-600 font-medium">Free</span>}
                    {room.pricingType === 'HOURLY' && <span className="text-amber-600 font-medium">₹{room.pricePerHour}/hr</span>}
                    {room.pricingType === 'DAILY' && <span className="text-amber-600 font-medium">₹{room.pricePerDay}/day</span>}
                    {room.pricingType === 'BOTH' && <span className="text-amber-600 font-medium">₹{room.pricePerHour}/hr · ₹{room.pricePerDay}/day</span>}
                  </td>
                  <td className="py-3 px-4 text-zinc-500">{room.equipment.map(eId => equipmentList.find(e => e.id === eId)?.name).filter(Boolean).join(', ') || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${room.isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                      {room.isActive ? 'Active' : 'Maintenance'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
