const { pool } = require('../config/db');

const getUsers = async () => {
  const [users] = await pool.query('SELECT id, name, email, role FROM users');
  return users;
};

const getUserSchedule = async (userId, date) => {
  // Return CONFIRMED meetings for a user on a given day (YYYY-MM-DD)
  const query = `
    SELECT m.id, m.title, m.start_time, m.end_time, r.name as room_name, u.name as organizer_name
    FROM meetings m
    JOIN meeting_participants mp ON mp.meeting_id = m.id
    JOIN rooms r ON m.room_id = r.id
    JOIN users u ON m.organizer_id = u.id
    WHERE mp.user_id = ? 
      AND m.status = 'CONFIRMED'
      AND DATE(m.start_time) = ?
    ORDER BY m.start_time ASC
  `;
  const [schedule] = await pool.query(query, [userId, date]);
  return schedule;
};

module.exports = { getUsers, getUserSchedule };
