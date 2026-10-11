const { pool } = require('../config/db');
const fs = require('fs');

const submitRating = async (meetingId, userId, { score, issues = [], comment = '' }, files = []) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify meeting is completed and user is participant
    const [meetings] = await conn.query('SELECT status, room_id, organizer_id FROM meetings WHERE id = ?', [meetingId]);
    if (meetings.length === 0) throw new Error('NOT_FOUND: Meeting not found');
    const meeting = meetings[0];

    if (meeting.status !== 'COMPLETED') {
        throw new Error('VALIDATION_ERROR: Meeting must be COMPLETED to rate.');
    }

    const [participants] = await conn.query('SELECT user_id FROM meeting_participants WHERE meeting_id = ? AND user_id = ?', [meetingId, userId]);
    if (participants.length === 0 && meeting.organizer_id !== userId) {
        throw new Error('VALIDATION_ERROR: You must be a participant to rate.');
    }

    const [existing] = await conn.query('SELECT id FROM room_ratings WHERE meeting_id = ? AND user_id = ?', [meetingId, userId]);
    if (existing.length > 0) throw new Error('VALIDATION_ERROR: Already rated');

    let issuesStr = null;
    let issuesArr = [];
    if (typeof issues === 'string') {
        issuesArr = issues.split(',').map(s => s.trim());
    } else if (Array.isArray(issues)) {
        issuesArr = issues;
    }
    
    if (issuesArr.length > 0) issuesStr = issuesArr.join(',');

    const [result] = await conn.query(
      'INSERT INTO room_ratings (meeting_id, room_id, user_id, score, issues, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [meetingId, meeting.room_id, userId, score, issuesStr, comment]
    );
    const ratingId = result.insertId;

    if (files && files.length > 0) {
        const photoVals = files.map(f => [ratingId, `/uploads/ratings/${f.filename}`]);
        await conn.query('INSERT INTO rating_photos (rating_id, file_path) VALUES ?', [photoVals]);
    }

    if (issuesArr.includes('BROKEN_PROJECTOR')) {
        const [equipment] = await conn.query('SELECT id FROM equipment WHERE name = "Projector"');
        if (equipment.length > 0) {
            await conn.query('UPDATE room_equipment SET is_working = 0 WHERE room_id = ? AND equipment_id = ?', [meeting.room_id, equipment[0].id]);
        }
    }

    await conn.commit();
    return { success: true };
  } catch (err) {
    await conn.rollback();
    if (files) {
        files.forEach(f => {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
    }
    throw err;
  } finally {
    conn.release();
  }
};

const getRoomRatings = async (roomId) => {
  const [[{ average, count }]] = await pool.query('SELECT AVG(score) as average, COUNT(*) as count FROM room_ratings WHERE room_id = ?', [roomId]);
  const [reviews] = await pool.query(`
    SELECT r.id, r.score, r.issues, r.comment, r.created_at, r.status, u.name as user_name
    FROM room_ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.room_id = ?
    ORDER BY r.created_at DESC
  `, [roomId]);

  const [photos] = await pool.query(`
    SELECT p.rating_id, p.file_path 
    FROM rating_photos p JOIN room_ratings r ON p.rating_id = r.id 
    WHERE r.room_id = ?
  `, [roomId]);

  return {
    average: average ? Number(Number(average).toFixed(1)) : 0,
    count: count || 0,
    reviews: reviews.map(r => ({
      ...r,
      issues: r.issues ? r.issues.split(',') : [],
      photos: photos.filter(p => p.rating_id === r.id).map(p => p.file_path)
    }))
  };
};

const getIssueReports = async () => {
   const [reports] = await pool.query(`
      SELECT r.*, rm.name as room_name, u.name as user_name 
      FROM room_ratings r 
      JOIN rooms rm ON r.room_id = rm.id 
      JOIN users u ON r.user_id = u.id
      WHERE r.issues IS NOT NULL AND r.issues != ''
      ORDER BY r.created_at DESC
   `);
   const [photos] = await pool.query('SELECT * FROM rating_photos');
   
   return reports.map(r => ({
       ...r,
       issues: r.issues ? r.issues.split(',') : [],
       photos: photos.filter(p => p.rating_id === r.id).map(p => p.file_path)
   }));
};

const resolveIssue = async (ratingId, adminNote) => {
   await pool.query('UPDATE room_ratings SET status = "RESOLVED", resolved_at = NOW(), admin_note = ? WHERE id = ?', [adminNote, ratingId]);
   return { success: true };
};

module.exports = { submitRating, getRoomRatings, getIssueReports, resolveIssue };
