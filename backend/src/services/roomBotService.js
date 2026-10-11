const { pool } = require('../config/db');
const { checkRoomAvailability, checkCapacity, checkEquipment } = require('./availabilityService');
const { findAlternativeRooms, autoSelectRoom, findAlternativeSlots } = require('./suggestionService');
const { createMeeting } = require('./meetingService');
const { generateQR } = require('./qrService');
const dayjs = require('dayjs');

const processMessage = async (sessionId, text, userId) => {
  // 1. Load pending request
  let pendingRequest = {};
  const [sessions] = await pool.query('SELECT pending_request FROM chat_sessions WHERE session_id = ?', [sessionId]);
  if (sessions.length > 0 && sessions[0].pending_request) {
    try { pendingRequest = JSON.parse(sessions[0].pending_request); } catch(e){}
  }

  // 2. Extract fields (very simplified logic based on instructions)
  const lowerText = text.toLowerCase();
  
  const attendeesMatch = lowerText.match(/(\d+)\s*(people|persons|members|attendees)/);
  if (attendeesMatch) pendingRequest.attendees = parseInt(attendeesMatch[1], 10);

  if (lowerText.includes('today')) pendingRequest.date = dayjs().format('YYYY-MM-DD');
  if (lowerText.includes('tomorrow')) pendingRequest.date = dayjs().add(1, 'day').format('YYYY-MM-DD');
  
  const timeMatch = lowerText.match(/(\d{1,2})(:\d{2})?\s*(am|pm)/);
  if (timeMatch) {
     let hour = parseInt(timeMatch[1], 10);
     if (timeMatch[3] === 'pm' && hour < 12) hour += 12;
     if (timeMatch[3] === 'am' && hour === 12) hour = 0;
     const minute = timeMatch[2] ? timeMatch[2].substring(1) : '00';
     pendingRequest.startTime = `${hour.toString().padStart(2, '0')}:${minute}`;
  }

  const durationMatch = lowerText.match(/(\d+)\s*(hour|hr|min)/);
  if (durationMatch) {
      if (durationMatch[2].startsWith('h')) {
          pendingRequest.durationMins = parseInt(durationMatch[1], 10) * 60;
      } else {
          pendingRequest.durationMins = parseInt(durationMatch[1], 10);
      }
  }

  const [equipmentList] = await pool.query('SELECT id, LOWER(name) as name FROM equipment');
  if (!pendingRequest.requiredEquipmentIds) pendingRequest.requiredEquipmentIds = [];
  equipmentList.forEach(eq => {
      if (lowerText.includes(eq.name) && !pendingRequest.requiredEquipmentIds.includes(eq.id)) {
          pendingRequest.requiredEquipmentIds.push(eq.id);
      }
  });

  // Intents
  if (lowerText.includes('free rooms now')) {
      const { getFreeRoomsNow } = require('./meetingService');
      const free = await getFreeRoomsNow();
      return { type: 'suggestions', text: 'Here are the rooms free right now:', rooms: free };
  }
  
  if (lowerText.includes('cancel my next meeting')) {
      // Find next meeting
      const { getMeetings, cancelMeeting } = require('./meetingService');
      const myMeetings = await getMeetings({ userId, status: 'CONFIRMED', dateFrom: dayjs().format('YYYY-MM-DD HH:mm:ss') });
      if (myMeetings.length > 0) {
          const next = myMeetings[0];
          await cancelMeeting(next.id, userId, 'Cancelled by RoomBot');
          return { type: 'confirmed', text: `I have cancelled "${next.title}".` };
      }
      return { type: 'question', text: "You don't have any upcoming meetings to cancel." };
  }

  // Booking intent fallback
  if (!pendingRequest.attendees) {
      await saveSession(sessionId, pendingRequest);
      return { type: 'question', text: 'How many people will attend?' };
  }
  if (!pendingRequest.date) {
      await saveSession(sessionId, pendingRequest);
      return { type: 'question', text: 'What date?' };
  }
  if (!pendingRequest.startTime) {
      await saveSession(sessionId, pendingRequest);
      return { type: 'question', text: 'What time should the meeting start?' };
  }

  // Complete request
  pendingRequest.durationMins = pendingRequest.durationMins || 60;
  const startFull = `${pendingRequest.date} ${pendingRequest.startTime}:00`;
  const endFull = dayjs(startFull).add(pendingRequest.durationMins, 'minute').format('YYYY-MM-DD HH:mm:ss');
  
  const reqObj = {
      title: 'RoomBot Booking',
      date: pendingRequest.date,
      startTime: startFull,
      endTime: endFull,
      attendees: pendingRequest.attendees,
      requiredEquipmentIds: pendingRequest.requiredEquipmentIds,
      participantIds: []
  };

  const alternatives = await findAlternativeRooms(reqObj);
  
  if (alternatives.length === 0) {
      const slots = await findAlternativeSlots(null, pendingRequest.date, pendingRequest.durationMins, reqObj);
      await saveSession(sessionId, {}); // clear
      return { type: 'conflict', text: 'No rooms match your request at that time.', alternativeRooms: [], alternativeSlots: slots };
  }

  // If auto-select allowed or only 1 choice
  if (lowerText.includes('book') || alternatives.length === 1) {
      const bestRoom = alternatives[0];
      reqObj.roomId = bestRoom.id;
      try {
         const result = await createMeeting(userId, reqObj);
         const qrUrl = await generateQR(result.meetingId, result.checkinToken);
         await saveSession(sessionId, {}); // clear
         const { getMeetingById } = require('./meetingService');
         const m = await getMeetingById(result.meetingId);
         return { type: 'confirmed', text: 'Meeting confirmed!', meeting: m, qrUrl };
      } catch (err) {
         return { type: 'conflict', text: err.message, alternativeRooms: alternatives, alternativeSlots: [] };
      }
  }

  await saveSession(sessionId, pendingRequest);
  return { type: 'suggestions', text: 'I found a few options. Which one would you like?', rooms: alternatives };
};

const saveSession = async (sessionId, data) => {
  await pool.query(
    'INSERT INTO chat_sessions (session_id, pending_request) VALUES (?, ?) ON DUPLICATE KEY UPDATE pending_request = ?',
    [sessionId, JSON.stringify(data), JSON.stringify(data)]
  );
};

module.exports = { processMessage };
