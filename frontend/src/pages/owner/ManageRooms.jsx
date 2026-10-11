import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { rooms as seedRooms, equipmentList } from '../../mock/seed';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageRooms() {
  const [rooms, setRooms] = useState(seedRooms);
  const [editingRoom, setEditingRoom] = useState(null); // null = closed, 'new' or room object
  const [form, setForm] = useState({ name: '', floor: 1, capacity: 4, isActive: true, pricingType: 'FREE', pricePerHour: 0, pricePerDay: 0, equipment: [] });

  const openNew = () => {
    setForm({ name: '', floor: 1, capacity: 4, isActive: true, pricingType: 'FREE', pricePerHour: 0, pricePerDay: 0, equipment: [] });
    setEditingRoom('new');
  };

  const openEdit = (room) => {
    setForm({ ...room });
    setEditingRoom(room);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Room name is required'); return; }
    if (editingRoom === 'new') {
      const newRoom = { ...form, id: Date.now(), baseScore: 80, ratings: [] };
      setRooms([...rooms, newRoom]);
      toast.success(`Room "${form.name}" created!`);
    } else {
      setRooms(rooms.map(r => r.id === editingRoom.id ? { ...r, ...form } : r));
      toast.success(`Room "${form.name}" updated!`);
    }
    setEditingRoom(null);
  };

  const handleDelete = (room) => {
    setRooms(rooms.filter(r => r.id !== room.id));
    toast.success(`Room "${room.name}" deleted.`);
  };

  const toggleEquip = (eId) => {
    setForm(prev => ({
      ...prev,
      equipment: prev.equipment.includes(eId)
        ? prev.equipment.filter(id => id !== eId)
        : [...prev.equipment, eId]
    }));
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-rose-500 outline-none transition-all text-zinc-900 dark:text-zinc-100";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Rooms</h1>
          <p className="text-zinc-500 text-sm">Add, edit, or remove rooms from your property.</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2"><Plus size={18} /> Add Room</Button>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {rooms.map((room, i) => (
          <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="h-full">
            <Card className="p-5 relative group h-full flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{room.name}</h3>
                  <p className="text-zinc-500 text-sm">Floor {room.floor} • {room.capacity} people</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${room.isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                  {room.isActive ? 'Active' : 'Offline'}
                </span>
              </div>

              <div className="text-sm text-zinc-500 mb-3">
                {room.pricingType === 'FREE' && 'Free to use'}
                {room.pricingType === 'HOURLY' && `₹${room.pricePerHour}/hour`}
                {room.pricingType === 'DAILY' && `₹${room.pricePerDay}/day`}
                {room.pricingType === 'BOTH' && `₹${room.pricePerHour}/hr or ₹${room.pricePerDay}/day`}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
                {room.equipment.map(eId => {
                  const eq = equipmentList.find(e => e.id === eId);
                  return eq ? <span key={eId} className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 h-fit">{eq.name}</span> : null;
                })}
                {room.equipment.length === 0 && <span className="text-xs text-zinc-400">No equipment</span>}
              </div>

              <div className="flex gap-2 mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-700/50">
                <Button variant="ghost" className="flex-1 text-sm" onClick={() => openEdit(room)}><Pencil size={14} className="mr-1" /> Edit</Button>
                <Button variant="danger" className="text-sm px-3" onClick={() => handleDelete(room)}><Trash2 size={14} /></Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {editingRoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold">{editingRoom === 'new' ? 'Add New Room' : `Edit ${form.name}`}</h2>
                <button onClick={() => setEditingRoom(null)} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Room Name</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Orion" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Floor</label>
                    <input type="number" min="1" value={form.floor} onChange={e => setForm({...form, floor: parseInt(e.target.value)})} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Capacity</label>
                    <input type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} className={inputClass} />
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Pricing Type</label>
                  <select value={form.pricingType} onChange={e => setForm({...form, pricingType: e.target.value})} className={inputClass}>
                    <option className="bg-white dark:bg-zinc-800" value="FREE">Free</option>
                    <option className="bg-white dark:bg-zinc-800" value="HOURLY">Hourly</option>
                    <option className="bg-white dark:bg-zinc-800" value="DAILY">Daily</option>
                    <option className="bg-white dark:bg-zinc-800" value="BOTH">Both (Hourly + Daily)</option>
                  </select>
                </div>
                {(form.pricingType === 'HOURLY' || form.pricingType === 'BOTH') && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Price per Hour (₹)</label>
                    <input type="number" min="0" value={form.pricePerHour} onChange={e => setForm({...form, pricePerHour: parseInt(e.target.value)})} className={inputClass} />
                  </div>
                )}
                {(form.pricingType === 'DAILY' || form.pricingType === 'BOTH') && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Price per Day (₹)</label>
                    <input type="number" min="0" value={form.pricePerDay} onChange={e => setForm({...form, pricePerDay: parseInt(e.target.value)})} className={inputClass} />
                  </div>
                )}

                {/* Equipment */}
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-2">Equipment</label>
                  <div className="flex flex-wrap gap-2">
                    {equipmentList.map(eq => {
                      const selected = form.equipment.includes(eq.id);
                      return (
                        <button key={eq.id} type="button" onClick={() => toggleEquip(eq.id)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${selected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600 ring-1 ring-amber-500/20' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'}`}
                        >
                          {eq.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Room is Active</span>
                  <button onClick={() => setForm({...form, isActive: !form.isActive})}
                    className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${form.isActive ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                  >
                    <motion.div layout className={`w-5 h-5 rounded-full bg-white shadow-sm ${form.isActive ? 'ml-auto' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-700 flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setEditingRoom(null)}>Cancel</Button>
                <Button className="flex-1 flex items-center justify-center gap-2" onClick={handleSave}><Save size={16} /> {editingRoom === 'new' ? 'Create Room' : 'Save Changes'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
