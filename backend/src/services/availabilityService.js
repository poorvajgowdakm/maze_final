const { pool } = require('../config/db');

const checkRoomAvailability = async (roomId, start, end, excludeMeetingId = null, connection = pool, excludeLockToken = null) => {
  // Check confirmed meetings
  const query = `
    SELECT COUNT(*) AS c FROM meetings
    WHERE room_id = ? AND status = 'CONFIRMED'
      AND start_time < ? AND end_time > ?
      AND (? IS NULL OR id <> ?)
  `;
  const [[{ c }]] = await connection.query(query, [roomId, end, start, excludeMeetingId, excludeMeetingId]);
  
  if (c > 0) return false;

  // Check active locks
  const lockQuery = `
    SELECT COUNT(*) AS lock_count FROM slot_locks
    WHERE room_id = ? AND expires_at > NOW()
      AND start_time < ? AND end_time > ?
      AND (? IS NULL OR lock_token <> ?)
  `;
  const [[{ lock_count }]] = await connection.query(lockQuery, [roomId, end, start, excludeLockToken, excludeLockToken]);
  
  if (lock_count > 0) return false;

  return true;
};

const checkParticipantConflicts = async (userIds, start, end, excludeMeetingId = null, connection = pool, excludeLockToken = null) => {
  if (!userIds || userIds.length === 0) return [];
  
  const query = `
    SELECT u.name, m.title 
    FROM meeting_participants mp
    JOIN meetings m ON m.id = mp.meeting_id AND m.status = 'CONFIRMED'
    JOIN users u ON u.id = mp.user_id
    WHERE mp.user_id IN (?) 
      AND m.start_time < ? AND m.end_time > ?
      AND (? IS NULL OR m.id <> ?)
  `;
  const [conflicts] = await connection.query(query, [userIds, end, start, excludeMeetingId, excludeMeetingId]);
  
  // Also check locks for participant conflicts (JSON array contains in MySQL is tricky, so let's do a simplified check or fetch and filter)
  const lockQuery = `
    SELECT u.name, 'Pending Booking' as title, sl.participant_ids
    FROM slot_locks sl
    JOIN users u ON u.id = sl.user_id
    WHERE sl.expires_at > NOW()
      AND sl.start_time < ? AND sl.end_time > ?
      AND (? IS NULL OR sl.lock_token <> ?)
  `;
  const [locks] = await connection.query(lockQuery, [end, start, excludeLockToken, excludeLockToken]);
  
  const lockConflicts = [];
  locks.forEach(lock => {
    let pIds = [];
    try { pIds = JSON.parse(lock.participant_ids) || []; } catch(e){}
    // Also consider the user holding the lock
    pIds.push(lock.user_id);
    
    userIds.forEach(uid => {
      if (pIds.includes(uid)) {
        lockConflicts.push({ name: lock.name, title: lock.title });
      }
    });
  });

  return [...conflicts, ...lockConflicts];
};

const checkCapacity = async (roomId, attendees, connection = pool) => {
  const [rooms] = await connection.query('SELECT capacity FROM rooms WHERE id = ?', [roomId]);
  if (rooms.length === 0) throw new Error('NOT_FOUND');
  return rooms[0].capacity >= attendees;
};

const checkEquipment = async (roomId, requiredEquipmentIds, connection = pool) => {
  if (!requiredEquipmentIds || requiredEquipmentIds.length === 0) return { missing: [] };
  
  const [equipment] = await connection.query(`
    SELECT e.id, e.name, re.is_working
    FROM room_equipment re
    JOIN equipment e ON re.equipment_id = e.id
    WHERE re.room_id = ?
  `, [roomId]);

  const missing = [];
  const roomEqMap = {};
  equipment.forEach(e => { roomEqMap[e.id] = e; });

  for (const reqId of requiredEquipmentIds) {
    if (!roomEqMap[reqId] || !roomEqMap[reqId].is_working) {
      // Find the name if possible
      const [eqInfo] = await connection.query('SELECT name FROM equipment WHERE id = ?', [reqId]);
      missing.push({ id: reqId, name: eqInfo[0] ? eqInfo[0].name : 'Unknown' });
    }
  }

  return { missing };
};

module.exports = {
  checkRoomAvailability,
  checkParticipantConflicts,
  checkCapacity,
  checkEquipment
};
