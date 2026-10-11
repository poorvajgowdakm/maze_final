import { useState } from 'react';
import { api } from '../api/apiClient';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RoomCard } from '../components/RoomCard';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import useStore from '../store/useStore';
import { Monitor, Wifi, Video, Mic, Tv, Projector, IndianRupee, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';

// Helper: generate 12-hour time options
const timeOptions = [];
for (let h = 6; h <= 21; h++) {
  for (let m = 0; m < 60; m += 30) {
    const h24 = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const label = `${h12}:${String(m).padStart(2,'0')} ${period}`;
    timeOptions.push({ value: h24, label });
  }
}

// Helper: convert 24h to 12h display
const to12h = (time24) => {
  const opt = timeOptions.find(t => t.value === time24);
  return opt ? opt.label : time24;
};

const meetingTypes = [
  { value: 'team_standup', label: 'Team Standup', icon: '🧑‍💻' },
  { value: 'client_call', label: 'Client Call', icon: '📞' },
  { value: 'brainstorm', label: 'Brainstorming', icon: '💡' },
  { value: 'presentation', label: 'Presentation', icon: '📊' },
  { value: 'interview', label: 'Interview', icon: '🎤' },
  { value: 'workshop', label: 'Workshop', icon: '🛠️' },
];

const equipmentList = [
  { id: 'projector', label: 'Projector', icon: Projector },
  { id: 'whiteboard', label: 'Whiteboard', icon: Tv },
  { id: 'video_conf', label: 'Video Conf', icon: Video },
  { id: 'mic', label: 'Microphone', icon: Mic },
  { id: 'monitor', label: 'Monitor', icon: Monitor },
  { id: 'wifi', label: 'High-Speed WiFi', icon: Wifi },
];

export default function Book() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: 'Design Sync',
    attendees: 4,
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    meetingType: 'team_standup',
    equipment: [],
  });
  const [alternatives, setAlternatives] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [bookedRoom, setBookedRoom] = useState(null);
  const [totalCost, setTotalCost] = useState(0);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  const { addMeeting, user } = useStore();

  // Calculate meeting duration in hours
  const getDurationHours = () => {
    const [sh, sm] = formData.startTime.split(':').map(Number);
    const [eh, em] = formData.endTime.split(':').map(Number);
    return Math.max(0.5, (eh * 60 + em - sh * 60 - sm) / 60);
  };

  // Calculate cost based on room pricing
  const calculateCost = (room) => {
    if (!room || room.pricingType === 'FREE') return 0;
    const hours = getDurationHours();
    if (room.pricingType === 'HOURLY') {
      return Math.ceil(hours) * (room.pricePerHour || room.price_per_hour || 0);
    }
    if (room.pricingType === 'DAILY') {
      return room.pricePerDay || room.price_per_day || 0;
    }
    if (room.pricingType === 'BOTH') {
      const hourlyCost = Math.ceil(hours) * (room.pricePerHour || room.price_per_hour || 0);
      const dailyCost = room.pricePerDay || room.price_per_day || 0;
      return Math.min(hourlyCost, dailyCost); // Best deal for the client
    }
    return 0;
  };

  const toggleEquipment = (id) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(id)
        ? prev.equipment.filter(e => e !== id)
        : [...prev.equipment, id]
    }));
  };

  const handleCheck = async () => {
    setIsChecking(true);
    setConflict(false);
    try {
      const allRooms = await api.getRooms();
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = `${formData.date}T${formData.endTime}:00`;

      // Check real availability for each room in parallel against the database
      const checkPromises = allRooms.map(async (r) => {
         if (!r.isActive) return null; // skip inactive
         try {
            await api.checkAvailability({
                roomId: r.id,
                startTime: startDateTime,
                endTime: endDateTime,
                attendees: formData.attendees,
                requiredEquipmentIds: formData.equipment
            });
            return r;
         } catch(e) {
            return null; // Room booked, capacity exceeded, or equipment missing
         }
      });
      
      const validRooms = (await Promise.all(checkPromises)).filter(Boolean);
      
      if (validRooms.length === 0) {
        setConflict(true);
        setAlternatives([]);
        setStep(2);
        return;
      }

      const scoredRooms = validRooms.map(r => {
        let score = 100;
        let reasons = [];
        
        if (r.capacity > formData.attendees * 2.5) {
          score -= 15;
          reasons.push(`Larger than needed`);
        } else {
          reasons.push(`Perfect size`);
        }

        if (formData.equipment.length > 0) {
          reasons.push(`Has all equipment`);
        }
        
        return {
          ...r,
          matchScore: Math.max(0, score),
          reason: reasons.join(' · ')
        };
      });
      
      const bestRooms = scoredRooms
        .sort((a, b) => {
          if (b.matchScore === a.matchScore) {
             return Math.abs(a.capacity - formData.attendees) - Math.abs(b.capacity - formData.attendees);
          }
          return b.matchScore - a.matchScore;
        })
        .slice(0, 3);
        
      setAlternatives(bestRooms);
      setStep(2);
    } catch (e) {
      console.error(e);
      toast.error("Failed to check availability");
    } finally {
      setIsChecking(false);
    }
  };

  const handleBook = async (roomId) => {
    const room = alternatives.find(r => r.id === roomId);
    const cost = calculateCost(room);
    setBookedRoom(room);
    setTotalCost(cost);
    setPaymentConfirmed(false);

    const meetingData = {
        title: formData.title,
        roomId: roomId,
        startTime: `${formData.date}T${formData.startTime}:00`,
        endTime: `${formData.date}T${formData.endTime}:00`,
        attendees: formData.attendees,
        meetingType: formData.meetingType,
        equipment: formData.equipment,
        organizerId: user.id
    };
    try {
        const result = await api.bookMeeting(meetingData);
        addMeeting(result);
        if (cost === 0) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        setStep(3);
    } catch (e) {
        toast.error("Booking failed");
    }
  };

  const handlePaymentConfirm = () => {
    setPaymentConfirmed(true);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    toast.success('Payment received! Your booking is confirmed.');
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-rose-500 outline-none transition-all text-zinc-900 dark:text-zinc-100";
  const labelClass = "block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300";

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Progress steps removed */}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Card className="p-8 max-w-2xl mx-auto shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Meeting Details</h2>
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className={labelClass}>Title</label>
                  <input value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className={inputClass} />
                </div>

                {/* Date + Attendees */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Date</label>
                    <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Attendees</label>
                    <input type="number" min="1" value={formData.attendees} onChange={e=>setFormData({...formData, attendees: parseInt(e.target.value)})} className={inputClass} />
                  </div>
                </div>

                {/* Start + End Time (12-hour dropdowns) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Start Time</label>
                    <select value={formData.startTime} onChange={e=>setFormData({...formData, startTime: e.target.value})} className={inputClass}>
                      {timeOptions.map(t => <option key={t.value} value={t.value} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>End Time</label>
                    <select value={formData.endTime} onChange={e=>setFormData({...formData, endTime: e.target.value})} className={inputClass}>
                      {timeOptions.map(t => <option key={t.value} value={t.value} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">{t.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Meeting Type */}
                <div>
                  <label className={labelClass}>Meeting Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {meetingTypes.map(mt => (
                      <button
                        key={mt.value}
                        type="button"
                        onClick={() => setFormData({...formData, meetingType: mt.value})}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                          formData.meetingType === mt.value
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        <span>{mt.icon}</span> {mt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equipment Requirements */}
                <div>
                  <label className={labelClass}>Equipment Needed</label>
                  <div className="grid grid-cols-3 gap-3">
                    {equipmentList.map(eq => {
                      const Icon = eq.icon;
                      const selected = formData.equipment.includes(eq.id);
                      return (
                        <button
                          key={eq.id}
                          type="button"
                          onClick={() => toggleEquipment(eq.id)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                            selected
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                          }`}
                        >
                          <Icon size={16} /> {eq.label}
                        </button>
                      );
                    })}
                  </div>
                  {formData.equipment.length > 0 && (
                    <p className="text-xs text-zinc-500 mt-2">{formData.equipment.length} item(s) selected — rooms will be filtered to match.</p>
                  )}
                </div>

                <Button onClick={handleCheck} className="w-full mt-6 py-3 text-lg" disabled={isChecking}>{isChecking ? 'Scanning Availability...' : 'Find the Perfect Room'}</Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            {/* Conflict banner removed */}

            {alternatives.length === 0 ? (
               <div className="mt-8 text-center bg-zinc-50 dark:bg-zinc-800/50 p-10 rounded-3xl border border-zinc-200 dark:border-zinc-700">
                 <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">😕</div>
                 <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No Rooms Available</h2>
                 <p className="text-zinc-500 max-w-sm mx-auto mb-6">All matching rooms are booked for this time slot, or no rooms meet your capacity/equipment needs.</p>
                 <Button onClick={() => setStep(1)} className="px-8">Try Another Time</Button>
               </div>
            ) : (
              <>
                <div className="flex items-center justify-between mt-6">
                    <div>
                        <h2 className="text-2xl font-bold">Available Rooms</h2>
                        <p className="text-zinc-500">We found {alternatives.length} perfect matches for {formData.attendees} people.</p>
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
                           <div className="mt-4 space-y-1">
                             {calculateCost(r) > 0 && (
                               <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold text-center">₹{calculateCost(r).toLocaleString('en-IN')} for {getDurationHours()}h</p>
                             )}
                             <Button onClick={() => handleBook(r.id)} className="w-full bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">{calculateCost(r) > 0 ? `Book ${r.name} — ₹${calculateCost(r).toLocaleString('en-IN')}` : `Book ${r.name}`}</Button>
                           </div>
                       </div>
                     </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center text-center">
             <Card className="p-12 max-w-lg w-full flex flex-col items-center shadow-xl">
               {/* FREE room or payment confirmed */}
               {(totalCost === 0 || paymentConfirmed) ? (
                 <>
                   <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-5xl mb-6 shadow-lg shadow-emerald-100 animate-bounce">✨</div>
                   <h2 className="text-3xl font-extrabold mb-2 text-zinc-900 dark:text-white">Meeting Confirmed!</h2>
                   <p className="text-zinc-500 mb-8 font-medium">Your room is locked. Check in within 15 minutes of the start time or it will auto-release.</p>
                 </>
               ) : (
                 /* PAID room — show QR code */
                 <>
                   <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mb-4">
                     <IndianRupee size={28} />
                   </div>
                   <h2 className="text-3xl font-extrabold mb-2 text-zinc-900 dark:text-white">Complete Payment</h2>
                   <p className="text-zinc-500 mb-2 font-medium">Scan the QR code below to pay and finalize your reservation.</p>
                   <p className="text-3xl font-extrabold text-amber-600 mb-6">₹{totalCost.toLocaleString('en-IN')}</p>
                   
                   <div className="bg-white p-4 rounded-2xl shadow-lg border border-zinc-200 mb-4">
                     <QRCode
                       value={`upi://pay?pa=mazeout@upi&pn=MazeOut&am=${totalCost}&cu=INR&tn=Room%20${bookedRoom?.name || 'Booking'}%20-%20${formData.title}`}
                       size={200}
                       level="H"
                     />
                   </div>
                   <p className="text-xs text-zinc-400 mb-6 max-w-xs">
                     Pay via any UPI app (GPay, PhonePe, Paytm). Your booking will be held for 10 minutes.
                   </p>

                   <Button onClick={handlePaymentConfirm} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 mb-4">
                     I've Completed the Payment
                   </Button>
                 </>
               )}
               
               <div className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 mb-8 text-left border border-zinc-200 dark:border-zinc-700 space-y-1">
                   <p className="font-bold text-lg">{formData.title}</p>
                   <p className="text-zinc-500 text-sm">{formData.date} • {to12h(formData.startTime)} – {to12h(formData.endTime)}</p>
                   <p className="text-zinc-500 text-sm">Room {bookedRoom?.name || alternatives[0]?.name || 'Orion'} • {formData.attendees} attendees</p>
                   <p className="text-zinc-500 text-sm">Type: {meetingTypes.find(m => m.value === formData.meetingType)?.label || formData.meetingType}</p>
                   {formData.equipment.length > 0 && (
                     <p className="text-zinc-500 text-sm">Equipment: {formData.equipment.map(e => equipmentList.find(eq => eq.id === e)?.label).join(', ')}</p>
                   )}
                   {totalCost > 0 && (
                     <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700">
                       <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Total Cost</span>
                       <span className="text-sm font-bold text-amber-600">₹{totalCost.toLocaleString('en-IN')}</span>
                     </div>
                   )}
               </div>

               <Button onClick={() => { setStep(1); setConflict(false); setBookedRoom(null); setTotalCost(0); setPaymentConfirmed(false); }} className="w-full py-3" variant="secondary">Book Another Room</Button>
             </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
