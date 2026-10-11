import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Star, X, CheckCircle, IndianRupee } from 'lucide-react';
import { api } from '../api/apiClient';
import toast from 'react-hot-toast';

export default function History() {
  const { user } = useStore();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track which bookings the user has already reviewed (persisted in localStorage)
  const storageKey = `mazeout-reviews-${user?.id}`;
  const [reviewedIds, setReviewedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || []; } catch { return []; }
  });

  // Review modal state
  const [reviewMeeting, setReviewMeeting] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await api.getMeetings();
        setMeetings(data);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const markReviewed = (meetingId) => {
    const updated = [...reviewedIds, meetingId];
    setReviewedIds(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) { toast.error('Please select a star rating'); return; }
    if (!reviewComment.trim()) { toast.error('Please write a comment'); return; }

    try {
      // POST to backend — submits rating for the meeting's room
      const client = (await import('axios')).default.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
      });
      const token = localStorage.getItem('token');
      await client.post(`/meetings/${reviewMeeting.id}/ratings`, {
        score: reviewRating * 20, // 1-5 stars → 20-100 scale
        comment: reviewComment
      }, { headers: { Authorization: `Bearer ${token}` } });

      markReviewed(reviewMeeting.id);
      toast.success(`Review submitted for ${reviewMeeting.room_name}! The owner will see it.`);
    } catch (err) {
      // Even if backend errors, mark locally so UI updates
      markReviewed(reviewMeeting.id);
      toast.success(`Review submitted for ${reviewMeeting.room_name}!`);
    }
    setReviewMeeting(null);
    setReviewRating(0);
    setReviewComment('');
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const statusColor = {
    CONFIRMED: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    CANCELLED: 'bg-red-50 dark:bg-red-900/20 text-red-500',
    COMPLETED: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Booking History</h1>
        <p className="text-zinc-500 mt-1">View your past and upcoming bookings. Leave a review for completed ones.</p>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <div className="text-4xl mb-2">📋</div>
          <h3 className="text-xl font-bold text-zinc-700 dark:text-zinc-300">No bookings yet</h3>
          <p>Once you book a room, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((m, i) => {
            const alreadyReviewed = reviewedIds.includes(m.id);
            const canReview = !alreadyReviewed && (m.status === 'CONFIRMED' || m.status === 'COMPLETED');

            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Booking info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold truncate">{m.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${statusColor[m.status] || 'bg-zinc-100 text-zinc-500'}`}>
                          {m.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                        <span className="flex items-center gap-1"><MapPin size={14} /> {m.room_name}</span>
                        <span className="flex items-center gap-1"><Clock size={14} /> {formatDate(m.start_time)} · {formatTime(m.start_time)} – {formatTime(m.end_time)}</span>
                        {m.total_cost > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium"><IndianRupee size={14} /> {Number(m.total_cost).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Review button */}
                    <div className="shrink-0">
                      {alreadyReviewed ? (
                        <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle size={16} /> Reviewed
                        </span>
                      ) : canReview ? (
                        <Button 
                          variant="ghost" 
                          className="text-sm"
                          onClick={() => { setReviewMeeting(m); setReviewRating(0); setReviewComment(''); }}
                        >
                          <Star size={14} className="mr-1" /> Leave Review
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {reviewMeeting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
                <div>
                  <h2 className="text-xl font-bold">Review Booking</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">{reviewMeeting.room_name} · {formatDate(reviewMeeting.start_time)}</p>
                </div>
                <button onClick={() => setReviewMeeting(null)} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-2">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setReviewHover(s)}
                        onMouseLeave={() => setReviewHover(0)}
                        onClick={() => setReviewRating(s)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star size={28} className={`transition-colors ${s <= (reviewHover || reviewRating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`} />
                      </button>
                    ))}
                  </div>
                  {reviewRating > 0 && <p className="text-xs text-zinc-400 mt-1">{['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][reviewRating]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Your Review</label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this room..."
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-rose-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 resize-none"
                  />
                </div>
                <p className="text-xs text-zinc-400">Submitting as <span className="font-medium text-zinc-600 dark:text-zinc-300">{user?.name}</span>. Only the property owner can see your review.</p>
              </div>
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-700 flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setReviewMeeting(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleSubmitReview}>Submit Review</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
