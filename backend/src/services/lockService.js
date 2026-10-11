const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const lockSlot = async (userId, { roomId, start, end, participantIds = [] }, checkRoomAvailability, checkParticipantConflicts, checkCapacity, checkEquipment, attendees, equipmentIds) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock the room row
    await conn.query('SELECT * FROM rooms WHERE id = ? FOR UPDATE', [roomId]);

    // 2. Normal checks including other users' locks
    const roomAvailable = await checkRoomAvailability(roomId, start, end, null, conn);
    if (!roomAvailable) {
        throw new Error('SLOT_LOCKED: This slot is being booked by someone else or is already booked.');
    }
    
    // Quick capacity/equipment checks
    const [rooms] = await conn.query('SELECT capacity FROM rooms WHERE id = ?', [roomId]);
    if (rooms.length > 0 && rooms[0].capacity < attendees) {
        throw new Error('CAPACITY_EXCEEDED');
    }

    if (equipmentIds && equipmentIds.length > 0) {
        const { missing } = await checkEquipment(roomId, equipmentIds, conn);
        if (missing.length > 0) {
             throw new Error('EQUIPMENT_UNAVAILABLE');
        }
    }

    if (participantIds.length > 0) {
       const conflicts = await checkParticipantConflicts(participantIds, start, end, null, conn);
       if (conflicts.length > 0) {
           throw new Error('PARTICIPANT_CONFLICT');
       }
    }

    // 3. Delete existing lock for this user
    await conn.query('DELETE FROM slot_locks WHERE user_id = ?', [userId]);

    // 4. Insert new lock
    const lockToken = uuidv4();
    const lockMinutes = parseInt(process.env.LOCK_MINUTES || '5', 10);
    const expiresAt = new Date(Date.now() + lockMinutes * 60000);
    
    await conn.query(
      'INSERT INTO slot_locks (lock_token, room_id, user_id, participant_ids, start_time, end_time, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lockToken, roomId, userId, JSON.stringify(participantIds), start, end, expiresAt]
    );

    await conn.commit();
    return { lockToken, expiresAt, secondsLeft: lockMinutes * 60 };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const extendLock = async (lockToken, userId) => {
  const [locks] = await pool.query('SELECT * FROM slot_locks WHERE lock_token = ? AND user_id = ? AND expires_at > NOW()', [lockToken, userId]);
  if (locks.length === 0) throw new Error('Lock not found or expired');
  
  const lockMinutes = parseInt(process.env.LOCK_MINUTES || '5', 10);
  await pool.query('UPDATE slot_locks SET expires_at = DATE_ADD(expires_at, INTERVAL ? MINUTE) WHERE lock_token = ?', [lockMinutes, lockToken]);
  
  return { extended: true };
};

const releaseLock = async (lockToken, userId) => {
  await pool.query('DELETE FROM slot_locks WHERE lock_token = ? AND user_id = ?', [lockToken, userId]);
  return { released: true };
};

const getLockStatus = async (lockToken) => {
  const [locks] = await pool.query('SELECT expires_at, TIMESTAMPDIFF(SECOND, NOW(), expires_at) as secondsLeft FROM slot_locks WHERE lock_token = ?', [lockToken]);
  if (locks.length === 0 || locks[0].secondsLeft <= 0) {
    return { valid: false, secondsLeft: 0 };
  }
  return { valid: true, secondsLeft: locks[0].secondsLeft };
};

module.exports = { lockSlot, extendLock, releaseLock, getLockStatus };
