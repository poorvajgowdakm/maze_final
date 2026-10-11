import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Calendar } from 'lucide-react';
import { useEffect } from 'react';
import useStore from '../store/useStore';

export default function Landing() {
  const navigate = useNavigate();
  const { user, role } = useStore();

  useEffect(() => {
    if (user) {
      navigate(role === 'OWNER' ? '/owner/dashboard' : '/dashboard');
    }
  }, [user, role, navigate]);

  return (
    <div className="min-h-screen bg-zinc-900 text-white relative overflow-hidden flex flex-col">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-rose-950/20 to-zinc-900 z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
      
      {/* Top Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-10 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Calendar className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">MazeOut</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login?mode=login')}
            className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors px-4 py-2"
          >
            Log In
          </button>
          <Button 
            onClick={() => navigate('/login?mode=signup')}
            className="bg-white text-zinc-900 hover:bg-zinc-100 shadow-xl shadow-white/10"
          >
            Sign Up
          </Button>
        </div>
      </nav>

      {/* Main Content (Centered & Hovering) */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="max-w-4xl mx-auto"
        >
          {/* Animated badge */}
          <motion.div 
            animate={{ y: [-5, 5, -5] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Smart scheduling is here
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-tight mb-8">
            <span className="text-zinc-100">Stop hunting</span> for rooms.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-fuchsia-500">Start meeting.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12">
            MazeOut is your smart conflict-resolving scheduling assistant. 
            Book exactly what you need, without the friction.
          </p>

          <div className="flex justify-center">
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => navigate('/login')}
                className="text-lg px-8 py-4 bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 shadow-2xl shadow-rose-500/20"
              >
                Get Started for Free
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Bottom subtle glowing orb */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[800px] h-[300px] bg-rose-600/20 blur-[120px] rounded-[100%] pointer-events-none z-0"></div>
    </div>
  );
}
