import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Book from './pages/Book';
import Calendar from './pages/Calendar';
import Rooms from './pages/Rooms';
import History from './pages/History';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import ManageRooms from './pages/owner/ManageRooms';
import RoomReviews from './pages/owner/RoomReviews';
import AppLayout from './layouts/AppLayout';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg', duration: 4000 }} />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            {/* User Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/book" element={<Book />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/history" element={<History />} />
            
            {/* Owner Routes */}
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/rooms" element={<ManageRooms />} />
            <Route path="/owner/reviews" element={<RoomReviews />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}
export default App;
