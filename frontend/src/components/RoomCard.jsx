import { Card } from './ui/Card';
import { Users, Star, Monitor, Tv, Video, Mic, Projector, Wifi } from 'lucide-react';

const equipmentMap = {
  'projector': { icon: Projector, label: 'Projector' },
  'whiteboard': { icon: Tv, label: 'Whiteboard' },
  'video_conf': { icon: Video, label: 'Video Conf' },
  'mic': { icon: Mic, label: 'Microphone' },
  'monitor': { icon: Monitor, label: 'Monitor' },
  'wifi': { icon: Wifi, label: 'High-Speed WiFi' },
  1: { icon: Projector, label: 'Projector' },
  2: { icon: Tv, label: 'Whiteboard' },
  3: { icon: Video, label: 'Video Conf' },
  4: { icon: Mic, label: 'Microphone' },
};

export function RoomCard({ room, reason }) {
  return (
    <Card hover className="p-5 flex flex-col gap-4 overflow-hidden relative h-full">
      <div className="flex justify-between items-start mt-2">
        <div>
          <h3 className="text-lg font-bold">{room.name}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Floor {room.floor}</p>
        </div>
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500 font-semibold bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg text-sm">
          Pts {room.baseScore / 10}
        </div>
      </div>
      {reason && <p className="text-sm text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">{reason}</p>}
      
      <div className="flex flex-row items-end justify-between mt-auto pt-2">
        <div className="flex flex-wrap gap-2">
          <span title={`${room.capacity} People Capacity`} className="flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded-md text-zinc-600 dark:text-zinc-300 cursor-help">
            <Users size={12}/> {room.capacity}
          </span>
          {room.equipment?.map(eq => {
            const mapped = equipmentMap[eq];
            if (!mapped) return null;
            const Icon = mapped.icon;
            return (
              <span key={eq} title={mapped.label} className="flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded-md text-zinc-600 dark:text-zinc-300 cursor-help">
                <Icon size={12}/>
              </span>
            );
          })}
        </div>
        
        <div className="text-right shrink-0 ml-2">
          {(() => {
            const type = room.pricingType || room.pricing_type;
            const perHour = room.pricePerHour || room.price_per_hour;
            const perDay = room.pricePerDay || room.price_per_day;
            
            if (type === 'HOURLY') return <div className="font-bold text-zinc-900 dark:text-white">₹{perHour}<span className="text-xs text-zinc-500 font-normal">/hr</span></div>;
            if (type === 'DAILY') return <div className="font-bold text-zinc-900 dark:text-white">₹{perDay}<span className="text-xs text-zinc-500 font-normal">/day</span></div>;
            if (type === 'BOTH') return <div className="font-bold text-zinc-900 dark:text-white">₹{perHour}<span className="text-xs text-zinc-500 font-normal">/hr</span></div>;
            return <div className="font-bold text-emerald-600 dark:text-emerald-400">Free</div>;
          })()}
        </div>
      </div>
    </Card>
  );
}
