const { pool } = require('../config/db');
const dayjs = require('dayjs');
const { checkRoomAvailability, checkParticipantConflicts, checkCapacity, checkEquipment } = require('./availabilityService');
const { calculateCost } = require('../utils/pricing');

const findAlternativeRooms = async (request, connection = pool) => {
  const { date, startTime, endTime, attendees, requiredEquipmentIds = [] } = request;
  
  const [activeRooms] = await connection.query(`
    SELECT r.*,
           (SELECT AVG(score) FROM room_ratings WHERE room_id = r.id) as averageScore
    FROM rooms r WHERE r.is_active = 1
  `);
  
  const [allPhotos] = await connection.query('SELECT * FROM room_photos');
  
  const alternatives = [];
  
  for (const room of activeRooms) {
    if (room.capacity < attendees) continue;
    
    const { missing } = await checkEquipment(room.id, requiredEquipmentIds, connection);
    if (missing.length > 0) continue;
    
    const isAvailable = await checkRoomAvailability(room.id, startTime, endTime, null, connection);
    if (!isAvailable) continue;
    
    const capacityDiff = room.capacity - attendees;
    const fitScore = Math.max(0, 90 - (capacityDiff * 2));
    const avgScore = room.averageScore ? Number(room.averageScore) : 5.0;
    const matchScore = Math.min(100, Math.round(fitScore + avgScore));
    
    let reason = `Fits ${attendees} people`;
    if (requiredEquipmentIds.length > 0) reason += `, has required equipment`;
    reason += `, free at requested time.`;

    const { totalCost, note } = calculateCost(room, startTime, endTime);

    const roomPhotos = allPhotos.filter(p => p.room_id === room.id);
    const coverPhotoObj = roomPhotos.find(p => p.is_cover === 1) || roomPhotos[0];

    alternatives.push({
      ...room,
      averageScore: Number(avgScore.toFixed(1)),
      matchScore,
      reason,
      estimatedCost: totalCost,
      priceNote: note,
      coverPhoto: coverPhotoObj ? coverPhotoObj.file_path : null
    });
  }
  
  alternatives.sort((a, b) => b.matchScore - a.matchScore);
  return alternatives;
};

const findAlternativeSlots = async (roomId, date, durationMins, request, connection = pool) => {
  const { participantIds = [] } = request;
  const workStartStr = process.env.WORK_START || '09:00';
  const workEndStr = process.env.WORK_END || '18:00';
  const slots = [];
  
  let currentDateStr = date;
  let daysChecked = 0;
  
  while (slots.length < 5 && daysChecked < 3) {
    let currentTime = dayjs(`${currentDateStr}T${workStartStr}`);
    const endTimeLimit = dayjs(`${currentDateStr}T${workEndStr}`);
    
    if (currentTime.isBefore(dayjs())) {
      const diff = dayjs().diff(currentTime, 'minute');
      const blocks = Math.ceil(diff / 30);
      currentTime = currentTime.add(blocks * 30, 'minute');
    }

    while (currentTime.add(durationMins, 'minute').isBefore(endTimeLimit) || currentTime.add(durationMins, 'minute').isSame(endTimeLimit)) {
      if (slots.length >= 5) break;
      
      const slotStart = currentTime.format('YYYY-MM-DD HH:mm:ss');
      const slotEnd = currentTime.add(durationMins, 'minute').format('YYYY-MM-DD HH:mm:ss');
      
      const roomFree = await checkRoomAvailability(roomId, slotStart, slotEnd, null, connection);
      if (roomFree) {
        const conflicts = await checkParticipantConflicts(participantIds, slotStart, slotEnd, null, connection);
        if (conflicts.length === 0) {
          slots.push({
            roomId,
            date: currentTime.format('YYYY-MM-DD'),
            startTime: currentTime.format('HH:mm'),
            endTime: currentTime.add(durationMins, 'minute').format('HH:mm')
          });
        }
      }
      currentTime = currentTime.add(30, 'minute');
    }
    
    let nextDate = dayjs(currentDateStr).add(1, 'day');
    if (nextDate.day() === 6) nextDate = nextDate.add(2, 'day');
    if (nextDate.day() === 0) nextDate = nextDate.add(1, 'day');
    currentDateStr = nextDate.format('YYYY-MM-DD');
    daysChecked++;
  }
  
  return slots;
};

const autoSelectRoom = async (request, connection = pool) => {
  const alternatives = await findAlternativeRooms(request, connection);
  if (alternatives.length > 0) {
    return alternatives[0];
  }
  return null;
};

module.exports = {
  findAlternativeRooms,
  findAlternativeSlots,
  autoSelectRoom
};
