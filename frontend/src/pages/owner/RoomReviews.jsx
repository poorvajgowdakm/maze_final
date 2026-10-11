import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { motion } from 'framer-motion';
import { rooms as seedRooms } from '../../mock/seed';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Filter } from 'lucide-react';

// Seed some demo reviews
const seedReviews = [
  { id: 1, roomId: 1, userName: 'Asha Sharma', rating: 5, comment: 'Orion is perfect for quick team syncs. Clean, well-lit, and always available.', date: '2026-10-08', department: 'Engineering' },
  { id: 2, roomId: 1, userName: 'Ravi Kumar', rating: 4, comment: 'Good room but could use a better projector. Whiteboard markers were dry.', date: '2026-10-07', department: 'Design' },
  { id: 3, roomId: 3, userName: 'Meera Patel', rating: 5, comment: 'Atlas has everything you need for a client presentation. Video conferencing setup is top-notch.', date: '2026-10-09', department: 'Product' },
  { id: 4, roomId: 3, userName: 'Karan Singh', rating: 3, comment: 'The room was a bit warm. AC needs maintenance. Otherwise the equipment is great.', date: '2026-10-06', department: 'Marketing' },
  { id: 5, roomId: 5, userName: 'Asha Sharma', rating: 5, comment: 'Boardroom Prime is exceptional. Used it for our quarterly review and it was flawless.', date: '2026-10-10', department: 'Engineering' },
  { id: 6, roomId: 6, userName: 'Ravi Kumar', rating: 4, comment: 'Innovation Lab is massive and well-equipped. Wheelchair access is a great touch.', date: '2026-10-09', department: 'Design' },
  { id: 7, roomId: 7, userName: 'Meera Patel', rating: 2, comment: 'Apollo was dirty when we arrived. Needs better housekeeping between bookings.', date: '2026-10-05', department: 'Product' },
  { id: 8, roomId: 2, userName: 'Karan Singh', rating: 4, comment: 'Nebula is cozy and great for brainstorms. Love the speakerphone quality.', date: '2026-10-08', department: 'Marketing' },
  { id: 9, roomId: 10, userName: 'Asha Sharma', rating: 5, comment: 'Titan is our go-to for large all-hands meetings. Incredible space and equipment.', date: '2026-10-10', department: 'Engineering' },
  { id: 10, roomId: 4, userName: 'Ravi Kumar', rating: 3, comment: 'Zen Den is small but fine for 1-on-1s. Could use better ventilation.', date: '2026-10-04', department: 'Design' },
  { id: 11, roomId: 5, userName: 'Meera Patel', rating: 4, comment: 'Great room, but the daily pricing feels steep. Worth it for important meetings though.', date: '2026-10-03', department: 'Product' },
  { id: 12, roomId: 8, userName: 'Karan Singh', rating: 3, comment: 'Voyager only has a TV screen — would be nice to add a whiteboard at minimum.', date: '2026-10-02', department: 'Marketing' },
];

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star key={s} size={14} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 dark:text-zinc-600'} />
    ))}
  </div>
);

export default function RoomReviews() {
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const filteredReviews = seedReviews
    .filter(r => selectedRoom === 'all' || r.roomId === parseInt(selectedRoom))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'oldest') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
    });

  // Stats
  const activeReviews = selectedRoom === 'all' ? seedReviews : seedReviews.filter(r => r.roomId === parseInt(selectedRoom));
  const avgRating = activeReviews.length > 0 ? (activeReviews.reduce((s, r) => s + r.rating, 0) / activeReviews.length).toFixed(1) : '0.0';
  const positiveCount = activeReviews.filter(r => r.rating >= 4).length;
  const negativeCount = activeReviews.filter(r => r.rating <= 2).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Room Reviews</h1>
        <p className="text-zinc-500 text-sm">See what clients are saying about your rooms.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Star className="text-amber-500 fill-amber-500" size={22} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Avg. Rating</p>
              <p className="text-2xl font-extrabold">{avgRating}<span className="text-sm text-zinc-400 font-medium"> / 5</span></p>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <ThumbsUp className="text-emerald-500" size={22} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Positive</p>
              <p className="text-2xl font-extrabold">{positiveCount}<span className="text-sm text-zinc-400 font-medium"> reviews</span></p>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <ThumbsDown className="text-red-500" size={22} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Needs Attention</p>
              <p className="text-2xl font-extrabold">{negativeCount}<span className="text-sm text-zinc-400 font-medium"> reviews</span></p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <Filter size={16} />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <select
          value={selectedRoom}
          onChange={e => setSelectedRoom(e.target.value)}
          className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
        >
          <option value="all">All Rooms</option>
          {seedRooms.filter(r => r.isActive).map(room => (
            <option key={room.id} value={room.id}>{room.name}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
        <span className="text-sm text-zinc-400 ml-auto">{filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}</span>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review, i) => {
          const room = seedRooms.find(r => r.id === review.roomId);
          return (
            <motion.div key={review.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* User avatar */}
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {review.userName.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                      <div>
                        <span className="font-semibold text-sm">{review.userName}</span>
                        <span className="text-zinc-400 text-xs ml-2">{review.department}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-zinc-400">{review.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium">
                        {room?.name || 'Unknown Room'}
                      </span>
                      {review.rating >= 4 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-medium">
                          Positive
                        </span>
                      )}
                      {review.rating <= 2 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 font-medium">
                          Needs Attention
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      <MessageSquare size={13} className="inline mr-1.5 text-zinc-400 -mt-0.5" />
                      {review.comment}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {filteredReviews.length === 0 && (
          <Card className="p-12 text-center">
            <MessageSquare size={40} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
            <p className="text-zinc-500 font-medium">No reviews found for this room.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
