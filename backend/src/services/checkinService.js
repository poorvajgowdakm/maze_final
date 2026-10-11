const { pool } = require('../config/db');

const checkIn = async (token) => {
  const [meetings] = await pool.query('SELECT * FROM meetings WHERE checkin_token = ?', [token]);
  if (meetings.length === 0) throw new Error('NOT_FOUND: Invalid check-in token');

  const meeting = meetings[0];

  if (meeting.status !== 'CONFIRMED') {
      throw new Error(`VALIDATION_ERROR: Room was released because nobody checked in (Status: ${meeting.status}).`);
  }

  if (meeting.checked_in_at) {
      return { message: 'Already checked in.', meetingId: meeting.id };
  }

  // Allowed window: from 10 minutes before start until 15 minutes after start
  const now = new Date();
  const startTime = new Date(meeting.start_time);
  
  const windowStart = new Date(startTime.getTime() - 10 * 60000);
  const windowEnd = new Date(startTime.getTime() + 15 * 60000);

  if (now < windowStart) {
      throw new Error('VALIDATION_ERROR: Too early to check in. You can check in 10 minutes before the meeting starts.');
  }

  if (now > windowEnd) {
      throw new Error('VALIDATION_ERROR: Check-in window closed. (More than 15 minutes after start time).');
  }

  const conn = await pool.getConnection();
  try {
      await conn.beginTransaction();

      await conn.query('UPDATE meetings SET checked_in_at = NOW() WHERE id = ?', [meeting.id]);
      await conn.query('INSERT INTO meeting_history (meeting_id, action, details) VALUES (?, ?, ?)', [meeting.id, 'COMPLETED', 'Checked in']); // Using completed/checked_in representation

      await conn.commit();
      return { message: 'Checked in successfully. Enjoy your meeting!', meetingId: meeting.id };
  } catch (err) {
      await conn.rollback();
      throw err;
  } finally {
      conn.release();
  }
};

module.exports = { checkIn };
