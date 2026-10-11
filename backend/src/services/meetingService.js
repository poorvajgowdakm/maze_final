const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { checkRoomAvailability, checkParticipantConflicts, checkCapacity, checkEquipment } = require('./availabilityService');
const { findAlternativeRooms, findAlternativeSlots, autoSelectRoom } = require('./suggestionService');
const { calculateCost } = require('../utils/pricing');
const dayjs = require('dayjs');

const checkRequest = async (request) => {
  const { roomId, startTime, endTime, attendees = 1, requiredEquipmentIds = [], participantIds = [] } = request;
  
  const problems = [];
  
  if (roomId) {
      try {
          const capacityOk = await checkCapacity(roomId, attendees);
          if (!capacityOk) problems.push({ code: 'CAPACITY_EXCEEDED', message: 'Room capacity is too small' });
      } catch(e) { if(e.message==='NOT_FOUND') problems.push({code:'NOT_FOUND', message:'Room not found'}); }

      const { missing } = await checkEquipment(roomId, requiredEquipmentIds);
      if (missing.length > 0) {
          problems.push({ code: 'EQUIPMENT_UNAVAILABLE', message: 'Missing equipment', missing });
      }

      const roomFree = await checkRoomAvailability(roomId, startTime, endTime);
      if (!roomFree) problems.push({ code: 'ROOM_CONFLICT', message: 'This slot is not available.' });
  }

  const pConflicts = await checkParticipantConflicts(participantIds, startTime, endTime);
  if (pConflicts.length > 0) {
      problems.push({ code: 'PARTICIPANT_CONFLICT', message: 'Some participants are busy', users: pConflicts });
  }

  let estimatedCost = 0;
  let priceNote = null;
  
  if (roomId) {
      const [rooms] = await pool.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
      if (rooms.length > 0) {
          const costInfo = calculateCost(rooms[0], startTime, endTime);
          estimatedCost = costInfo.totalCost;
          priceNote = costInfo.note;
      }
  }

  if (problems.length === 0 && roomId) {
      return { available: true, problems: [], estimatedCost, priceNote };
  }

  const alternativeRooms = await findAlternativeRooms(request);
  let alternativeSlots = [];
  if (roomId) {
      const durationMins = dayjs(endTime).diff(dayjs(startTime), 'minute');
      alternativeSlots = await findAlternativeSlots(roomId, request.date || dayjs(startTime).format('YYYY-MM-DD'), durationMins, request);
  }

  return {
      available: false,
      problems,
      alternativeRooms,
      alternativeSlots,
      recommendedRoom: await autoSelectRoom(request)
  };
};

const createMeeting = async (userId, request) => {
  const { title, roomId, startTime, endTime, attendees, participantIds = [], requiredEquipmentIds = [], lockToken } = request;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (lockToken) {
       const [locks] = await conn.query('SELECT * FROM slot_locks WHERE lock_token = ? AND user_id = ? AND expires_at > NOW()', [lockToken, userId]);
       if (locks.length === 0) {
           throw new Error('VALIDATION_ERROR: Your hold expired. Please check availability again');
       }
       if (locks[0].room_id !== roomId || new Date(locks[0].start_time).getTime() !== new Date(startTime).getTime()) {
           throw new Error('VALIDATION_ERROR: Lock mismatch');
       }
    }

    const [rooms] = await conn.query('SELECT * FROM rooms WHERE id = ? FOR UPDATE', [roomId]);
    const room = rooms[0];
    
    if (participantIds.length > 0) {
        const sortedIds = [...participantIds, userId].sort((a,b) => a - b);
        await conn.query('SELECT id FROM users WHERE id IN (?) ORDER BY id FOR UPDATE', [sortedIds]);
    }

    // Re-check
    const roomFree = await checkRoomAvailability(roomId, startTime, endTime, null, conn, lockToken);
    if (!roomFree) throw new Error('ROOM_CONFLICT: This slot is not available.');
    
    const capacityOk = await checkCapacity(roomId, attendees, conn);
    if (!capacityOk) throw new Error('CAPACITY_EXCEEDED: Room capacity is too small');
    
    const { missing } = await checkEquipment(roomId, requiredEquipmentIds, conn);
    if (missing.length > 0) throw new Error('EQUIPMENT_UNAVAILABLE: Missing equipment');

    const pConflicts = await checkParticipantConflicts(participantIds, startTime, endTime, null, conn, lockToken);
    if (pConflicts.length > 0) throw new Error('PARTICIPANT_CONFLICT: Some participants are busy');

    const checkinToken = uuidv4();
    const { totalCost, note } = calculateCost(room, startTime, endTime);

    const [result] = await conn.query(
      'INSERT INTO meetings (title, room_id, organizer_id, start_time, end_time, attendees, checkin_token, total_cost, price_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, roomId, userId, startTime, endTime, attendees, checkinToken, totalCost, note]
    );
    const meetingId = result.insertId;

    if (participantIds.length > 0) {
      const pVals = participantIds.map(pId => [meetingId, pId]);
      await conn.query('INSERT IGNORE INTO meeting_participants (meeting_id, user_id) VALUES ?', [pVals]);
    }

    if (requiredEquipmentIds.length > 0) {
      const eVals = requiredEquipmentIds.map(eId => [meetingId, eId]);
      await conn.query('INSERT IGNORE INTO meeting_equipment (meeting_id, equipment_id) VALUES ?', [eVals]);
    }

    await conn.query('INSERT INTO meeting_history (meeting_id, action, details) VALUES (?, ?, ?)', [meetingId, 'CREATED', 'Meeting booked']);

    if (lockToken) {
       await conn.query('DELETE FROM slot_locks WHERE lock_token = ?', [lockToken]);
    }

    await conn.commit();

    // Trigger confirmation email
    try {
        const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
        if (users.length > 0) {
            const { sendBookingConfirmation } = require('./emailService');
            // send asynchronously so it doesn't block the response
            sendBookingConfirmation(users[0].email, {
                title,
                roomName: room.name,
                startTime,
                endTime,
                priceNote: note
            });
        }
    } catch(err) {
        console.error('Failed to send confirmation email:', err);
    }

    return { meetingId, checkinToken, totalCost };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const updateMeeting = async (meetingId, userId, request) => {
  const { title, roomId, startTime, endTime, attendees, participantIds, requiredEquipmentIds } = request;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [meetings] = await conn.query('SELECT organizer_id, status FROM meetings WHERE id = ? FOR UPDATE', [meetingId]);
    if (meetings.length === 0) throw new Error('NOT_FOUND');
    if (meetings[0].organizer_id !== userId) {
        throw new Error('FORBIDDEN: Only organizer can update');
    }
    if (meetings[0].status !== 'CONFIRMED') throw new Error('VALIDATION_ERROR: Meeting cannot be changed');

    const [rooms] = await conn.query('SELECT * FROM rooms WHERE id = ? FOR UPDATE', [roomId]);
    
    // Re-check
    const roomFree = await checkRoomAvailability(roomId, startTime, endTime, meetingId, conn);
    if (!roomFree) throw new Error('ROOM_CONFLICT');

    const { totalCost, note } = calculateCost(rooms[0], startTime, endTime);

    await conn.query(
      'UPDATE meetings SET title=?, room_id=?, start_time=?, end_time=?, attendees=?, total_cost=?, price_note=? WHERE id=?',
      [title, roomId, startTime, endTime, attendees, totalCost, note, meetingId]
    );

    if (participantIds !== undefined) {
      await conn.query('DELETE FROM meeting_participants WHERE meeting_id=?', [meetingId]);
      if (participantIds.length > 0) {
        const pVals = participantIds.map(pId => [meetingId, pId]);
        await conn.query('INSERT IGNORE INTO meeting_participants (meeting_id, user_id) VALUES ?', [pVals]);
      }
    }

    if (requiredEquipmentIds !== undefined) {
      await conn.query('DELETE FROM meeting_equipment WHERE meeting_id=?', [meetingId]);
      if (requiredEquipmentIds.length > 0) {
        const eVals = requiredEquipmentIds.map(eId => [meetingId, eId]);
        await conn.query('INSERT IGNORE INTO meeting_equipment (meeting_id, equipment_id) VALUES ?', [eVals]);
      }
    }

    await conn.query('INSERT INTO meeting_history (meeting_id, action, details) VALUES (?, ?, ?)', [meetingId, 'RESCHEDULED', 'Meeting updated']);

    await conn.commit();
    return { success: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const cancelMeeting = async (meetingId, userId, reason = '') => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [meetings] = await conn.query('SELECT organizer_id, status FROM meetings WHERE id = ? FOR UPDATE', [meetingId]);
    if (meetings.length === 0) throw new Error('NOT_FOUND');
    // We assume controller handles ADMIN override if needed, otherwise:
    if (meetings[0].organizer_id !== userId && userId !== 'ADMIN_OVERRIDE') throw new Error('FORBIDDEN');
    if (meetings[0].status !== 'CONFIRMED') throw new Error('VALIDATION_ERROR: Meeting cannot be changed');

    await conn.query(
      'UPDATE meetings SET status=?, cancel_reason=?, cancelled_at=NOW() WHERE id=?',
      ['CANCELLED', reason, meetingId]
    );
    await conn.query('INSERT INTO meeting_history (meeting_id, action, details) VALUES (?, ?, ?)', [meetingId, 'CANCELLED', reason]);

    await conn.commit();
    return { success: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const getMeetings = async ({ status, roomId, userId, dateFrom, dateTo }) => {
  let query = `
    SELECT m.*, r.name as room_name, u.name as organizer_name
    FROM meetings m
    JOIN rooms r ON m.room_id = r.id
    LEFT JOIN users u ON m.organizer_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND m.status = ?'; params.push(status); }
  if (roomId) { query += ' AND m.room_id = ?'; params.push(roomId); }
  if (dateFrom) { query += ' AND m.start_time >= ?'; params.push(dateFrom); }
  if (dateTo) { query += ' AND m.start_time <= ?'; params.push(dateTo); }
  
  if (userId) {
     query += ` AND (m.organizer_id = ? OR EXISTS (SELECT 1 FROM meeting_participants mp WHERE mp.meeting_id = m.id AND mp.user_id = ?))`;
     params.push(userId, userId);
  }
  
  query += ' ORDER BY m.start_time DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const getMeetingById = async (id) => {
  const [meetings] = await pool.query(`
    SELECT m.*, r.name as room_name, u.name as organizer_name
    FROM meetings m
    JOIN rooms r ON m.room_id = r.id
    LEFT JOIN users u ON m.organizer_id = u.id
    WHERE m.id = ?
  `, [id]);
  if (meetings.length === 0) return null;
  const meeting = meetings[0];

  const [participants] = await pool.query('SELECT u.id, u.name FROM meeting_participants mp JOIN users u ON u.id=mp.user_id WHERE mp.meeting_id=?', [id]);
  meeting.participants = participants;

  const [equipment] = await pool.query('SELECT e.id, e.name FROM meeting_equipment me JOIN equipment e ON e.id=me.equipment_id WHERE me.meeting_id=?', [id]);
  meeting.equipment = equipment;

  return meeting;
};

const getMeetingHistory = async (id) => {
  const [rows] = await pool.query('SELECT * FROM meeting_history WHERE meeting_id = ? ORDER BY action_time ASC', [id]);
  return rows;
};

const getRoomSchedule = async (roomId, date) => {
  const [rows] = await pool.query(`
    SELECT m.id, m.title, m.start_time, m.end_time, u.name as organizer
    FROM meetings m
    LEFT JOIN users u ON m.organizer_id = u.id
    WHERE m.room_id = ? AND m.status = 'CONFIRMED' AND DATE(m.start_time) = ?
    ORDER BY m.start_time ASC
  `, [roomId, date]);
  return rows;
};

const getFreeRoomsNow = async () => {
  const [rows] = await pool.query(`
    SELECT r.* FROM rooms r
    WHERE r.is_active = 1 AND NOT EXISTS (
      SELECT 1 FROM meetings m 
      WHERE m.room_id = r.id AND m.status = 'CONFIRMED' 
      AND NOW() BETWEEN m.start_time AND m.end_time
    )
  `);
  return rows;
};

const getDashboardStats = async () => {
  const [[{ todayMeetings }]] = await pool.query("SELECT COUNT(*) as todayMeetings FROM meetings WHERE DATE(start_time) = CURDATE()");
  const [freeRooms] = await getFreeRoomsNow();
  const freeRoomsNow = freeRooms ? freeRooms.length : 0;
  const [[{ cancelledToday }]] = await pool.query("SELECT COUNT(*) as cancelledToday FROM meetings WHERE status = 'CANCELLED' AND DATE(cancelled_at) = CURDATE()");
  
  const [upcoming] = await pool.query(`
    SELECT m.id, m.title, m.start_time, m.end_time, r.name as room_name 
    FROM meetings m JOIN rooms r ON m.room_id = r.id 
    WHERE m.status = 'CONFIRMED' AND m.start_time > NOW() 
    ORDER BY m.start_time ASC LIMIT 5
  `);

  return { todayMeetings, freeRoomsNow, cancelledToday, upcoming };
};

const generateICS = async (meetingId) => {
    const meeting = await getMeetingById(meetingId);
    if (!meeting) return null;
    
    const formatICSDate = (dateStr) => {
        return new Date(dateStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatICSDate(meeting.start_time);
    const end = formatICSDate(meeting.end_time);
    const now = formatICSDate(new Date());

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RoomScheduler//EN
BEGIN:VEVENT
UID:${meeting.id}@roomscheduler
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${meeting.title}
LOCATION:${meeting.room_name}
END:VEVENT
END:VCALENDAR`;

    return ics;
};

module.exports = {
  checkRequest,
  createMeeting,
  updateMeeting,
  cancelMeeting,
  getMeetings,
  getMeetingById,
  getMeetingHistory,
  getRoomSchedule,
  getFreeRoomsNow,
  getDashboardStats,
  generateICS
};
