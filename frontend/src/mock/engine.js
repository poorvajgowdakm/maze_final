import { isBefore, isAfter, isEqual, parseISO } from 'date-fns';
import { rooms, users, initialMeetings } from './seed';

// In-memory database for the frontend simulation
let db = {
  rooms: [...rooms],
  users: [...users],
  meetings: [...initialMeetings],
  issues: []
};

// Simulate network latency
export const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const checkOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  // Overlap occurs if (Start1 < End2) AND (End1 > Start2)
  return s1 < e2 && e1 > s2;
};

export const engine = {
  getRooms: async () => {
    await delay();
    return db.rooms;
  },

  getMeetings: async () => {
    await delay();
    return db.meetings;
  },

  checkAvailability: async (roomId, startTime, endTime, excludeMeetingId = null) => {
    await delay(300);
    const conflicts = db.meetings.filter(m => 
      m.roomId === roomId && 
      m.status === 'CONFIRMED' && 
      m.id !== excludeMeetingId &&
      checkOverlap(startTime, endTime, m.startTime, m.endTime)
    );
    return conflicts.length === 0;
  },

  bookMeeting: async (meetingData) => {
    await delay();
    const isFree = await engine.checkAvailability(meetingData.roomId, meetingData.startTime, meetingData.endTime);
    if (!isFree) {
      throw new Error("ROOM_CONFLICT");
    }
    
    const newMeeting = {
      ...meetingData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'CONFIRMED',
      createdAt: new Date().toISOString()
    };
    
    db.meetings.push(newMeeting);
    return newMeeting;
  },

  cancelMeeting: async (id) => {
    await delay();
    const m = db.meetings.find(x => x.id === id);
    if (m) m.status = 'CANCELLED';
    return { success: true };
  },

  submitRating: async (meetingId, score, issues, comment) => {
    await delay();
    const meeting = db.meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const room = db.rooms.find(r => r.id === meeting.roomId);
    if (room) {
      room.ratings.push({ score, issues, comment, date: new Date().toISOString() });
      
      // Learning loop: drop score if issues reported
      if (issues.length > 0) {
        room.baseScore = Math.max(0, room.baseScore - (issues.length * 5));
        db.issues.push({ roomId: room.id, meetingId, issues, resolved: false });
      }
    }
    return { success: true };
  },
  
  // Expose DB for direct manipulation by Simulator
  _db: db
};
