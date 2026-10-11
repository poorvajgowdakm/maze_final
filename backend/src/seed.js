const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');

const runSeed = async () => {
  console.log('🌱 Seeding backend specific data (Users, Owners, Rooms, Demo Meetings)...');

  try {
    await pool.query('DELETE FROM room_ratings; DELETE FROM rating_photos; DELETE FROM room_photos; DELETE FROM meeting_history; DELETE FROM meeting_equipment; DELETE FROM meeting_participants; DELETE FROM meetings; DELETE FROM room_equipment; DELETE FROM rooms; DELETE FROM equipment; DELETE FROM users;');
    await pool.query('ALTER TABLE meetings AUTO_INCREMENT = 1; ALTER TABLE users AUTO_INCREMENT = 1; ALTER TABLE rooms AUTO_INCREMENT = 1; ALTER TABLE equipment AUTO_INCREMENT = 1;');

    // --- Users ---
    const ownerHash = await bcrypt.hash('owner123', 10);
    const clientHash = await bcrypt.hash('client', 10);

    const usersData = [
        // 4 Owners (IDs 1-4)
        ['Arjun Mehta',   'arjun@venuehub.in',   ownerHash, 'OWNER'],
        ['Priya Sharma',  'priya@spacerental.in', ownerHash, 'OWNER'],
        ['Karthik Iyer',  'karthik@meetspace.in', ownerHash, 'OWNER'],
        ['Neha Reddy',    'neha@eliterooms.in',   ownerHash, 'OWNER'],
        // Clients (IDs 5-8)
        ['Client',  'client@test.com',  clientHash, 'USER'],
        ['Admin',   'admin@test.com',   await bcrypt.hash('admin123', 10), 'ADMIN'],
        ['Asha Kulkarni',  'asha@corp.com',  await bcrypt.hash('user123', 10), 'USER'],
        ['Ravi Nair',      'ravi@corp.com',  await bcrypt.hash('user123', 10), 'USER']
    ];

    // Add 20 mock users (IDs 9-28)
    for(let i=1; i<=20; i++) {
        usersData.push([`Guest User ${i}`, `guest${i}@demo.com`, clientHash, 'USER']);
    }

    // Add specific users for 2.13-C (IDs 29-36)
    const specificUsers = [
        ['Anita Rao', 'anita@corp.com', clientHash, 'USER'],     // 29
        ['Neha Gupta', 'neha.g@corp.com', clientHash, 'USER'],   // 30
        ['Karan Mehta', 'karan@corp.com', clientHash, 'USER'],   // 31
        ['Sameer Khan', 'sameer@corp.com', clientHash, 'USER'],  // 32
        ['Divya Menon', 'divya@corp.com', clientHash, 'USER'],   // 33
        ['Vikram Singh', 'vikram@corp.com', clientHash, 'USER'], // 34
        ['Rohan Das', 'rohan@corp.com', clientHash, 'USER'],     // 35
        ['Sneha Reddy', 'sneha.r@corp.com', clientHash, 'USER']  // 36
    ];
    usersData.push(...specificUsers);

    await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES ?', [usersData]);

    const roomsData = [
        // ═══ Arjun Mehta (Owner 1) — 12 rooms ═══
        ['The Boardroom',       1, 20,  1, 'HOURLY', 500,  null],
        ['Summit Hall',         1, 50,  1, 'BOTH',   1500, 8000],
        ['Brainstorm Bay',      2, 8,   1, 'HOURLY', 250,  null],
        ['Strategy Suite',      2, 12,  1, 'HOURLY', 400,  null],
        ['Keynote Arena',       3, 100, 1, 'DAILY',  null, 25000],
        ['Huddle Pod A',        1, 4,   1, 'HOURLY', 150,  null],
        ['Huddle Pod B',        1, 4,   1, 'HOURLY', 150,  null],
        ['The Think Tank',      2, 15,  1, 'BOTH',   600,  3500],
        ['Venture Lounge',      3, 30,  1, 'BOTH',   1200, 6000],
        ['Pitch Deck Room',     2, 10,  1, 'HOURLY', 350,  null],
        ['Innovators Corner',   3, 6,   1, 'HOURLY', 200,  null],
        ['Executive Chamber',   4, 25,  1, 'BOTH',   900,  5000],

        // ═══ Priya Sharma (Owner 2) — 10 rooms ═══
        ['Collaboration Cove',  1, 10,  2, 'HOURLY', 300,  null],
        ['Focus Room',          1, 4,   2, 'HOURLY', 180,  null],
        ['Synergy Hall',        2, 40,  2, 'BOTH',   1400, 7500],
        ['The Workshop',        2, 20,  2, 'HOURLY', 550,  null],
        ['Sprint Studio',       3, 8,   2, 'HOURLY', 280,  null],
        ['Roundtable Room',     1, 14,  2, 'BOTH',   500,  2800],
        ['Dialogue Den',        2, 6,   2, 'HOURLY', 220,  null],
        ['Conference Bay',      3, 30,  2, 'DAILY',  null, 10000],
        ['Nexus Point',         3, 18,  2, 'BOTH',   650,  3800],
        ['Panorama Suite',      4, 60,  2, 'DAILY',  null, 20000],

        // ═══ Karthik Iyer (Owner 3) — 8 rooms ═══
        ['Catalyst Room',       1, 12,  3, 'HOURLY', 400,  null],
        ['Vision Lab',          2, 8,   3, 'HOURLY', 300,  null],
        ['Accord Hall',         2, 35,  3, 'BOTH',   1100, 6500],
        ['The Forum',           3, 80,  3, 'DAILY',  null, 18000],
        ['Spark Chamber',       1, 6,   3, 'HOURLY', 200,  null],
        ['Milestone Room',      3, 16,  3, 'BOTH',   550,  3200],
        ['Agenda Suite',        2, 22,  3, 'BOTH',   750,  4200],
        ['Briefing Room',       1, 10,  3, 'HOURLY', 350,  null],

        // ═══ Neha Reddy (Owner 4) — 5 rooms ═══
        ['The Conclave',        1, 45,  4, 'BOTH',   1600, 9000],
        ['Harmony Hub',         2, 10,  4, 'HOURLY', 350,  null],
        ['Quorum Room',         1, 20,  4, 'HOURLY', 500,  null],
        ['Grand Pavilion',      3, 200, 4, 'DAILY',  null, 50000],
        ['Zen Den',             2, 4,   4, 'HOURLY', 180,  null],
        
        // ═══ Extra Specific Rooms for 2.13-C (IDs 36-46) ═══
        ['Teak Room',       1, 15, 1, 'HOURLY', 400, null],  // 36
        ['Orion Room',      2, 10, 2, 'HOURLY', 300, null],  // 37
        ['Alpha Huddle',    1, 5,  3, 'HOURLY', 150, null],  // 38
        ['Rosewood Room',   3, 25, 4, 'HOURLY', 800, null],  // 39
        ['Maple Room',      2, 10, 1, 'HOURLY', 350, null],  // 40
        ['Vega Room',       1, 20, 2, 'HOURLY', 500, null],  // 41
        ['Emerald Hall',    4, 60, 3, 'DAILY', null, 15000], // 42
        ['Lotus Pod',       1, 4,  4, 'HOURLY', 100, null],  // 43
        ['Sapphire Room',   2, 30, 1, 'HOURLY', 700, null],  // 44
        ['Coral Room',      1, 8,  2, 'HOURLY', 250, null],  // 45
        ['Cloud Boardroom', 4, 40, 3, 'HOURLY', 1200, null]  // 46
    ];

    await pool.query('INSERT INTO rooms (name, floor, capacity, owner_id, pricing_type, price_per_hour, price_per_day) VALUES ?', [roomsData]);

    // --- Equipment ---
    await pool.query('INSERT INTO equipment (name) VALUES ?', [[
        ['Projector'], ['Whiteboard'], ['Video Conferencing'], ['Microphone'],
        ['Smart TV'], ['Speakerphone'], ['Webcam']
    ]]);

    // Room Equipment (Assign basic equipment to all new rooms so tests don't fail on equipment checks)
    const roomEqData = [];
    for(let r=1; r<=46; r++) {
        roomEqData.push([r, 1, 1], [r, 2, 1]); // Give every room a Projector & Whiteboard
    }
    await pool.query('INSERT INTO room_equipment (room_id, equipment_id, is_working) VALUES ?', [roomEqData]);


    // --- 2.13-C SAMPLE SLOTS ---
    const meetingsData = [];
    const participantsData = [];
    const historyData = [];
    
    // Function to calculate working days
    const getWorkDay = (startDay, offsetDays) => {
        let d = new Date(startDay);
        let added = 0;
        while(added < offsetDays) {
            d.setDate(d.getDate() + 1);
            if (d.getDay() !== 0 && d.getDay() !== 6) {
                added++;
            }
        }
        return d.toISOString().split('T')[0];
    };
    
    const today = new Date();
    const day1 = getWorkDay(today, 1);
    const day2 = getWorkDay(today, 2);
    const day3 = getWorkDay(today, 3);
    const day4 = getWorkDay(today, 4);

    // Mappings
    const usersMap = {
        'Anita Rao': 29,
        'Neha Gupta': 30,
        'Karan Mehta': 31,
        'Sameer Khan': 32,
        'Divya Menon': 33,
        'Vikram Singh': 34,
        'Rohan Das': 35,
        'Sneha Reddy': 36
    };
    
    const roomsMap = {
        'Summit Hall': 2,
        'Teak Room': 36,
        'Orion Room': 37,
        'Alpha Huddle': 38,
        'Rosewood Room': 39,
        'Maple Room': 40,
        'Vega Room': 41,
        'Emerald Hall': 42,
        'Lotus Pod': 43,
        'Sapphire Room': 44,
        'Coral Room': 45,
        'Cloud Boardroom': 46
    };

    const slots = [
        // Day 1
        [1, day1, '10:00:00', '11:00:00', 'Summit Hall', 'Anita Rao', 8, 'CONFIRMED'],
        [2, day1, '14:00:00', '15:00:00', 'Teak Room', 'Neha Gupta', 6, 'CONFIRMED', ['Rohan Das']],
        [3, day1, '16:00:00', '17:00:00', 'Orion Room', 'Karan Mehta', 4, 'CANCELLED'],
        // Day 2
        [4, day2, '09:00:00', '10:00:00', 'Alpha Huddle', 'Sameer Khan', 3, 'CONFIRMED'],
        [5, day2, '11:00:00', '12:30:00', 'Rosewood Room', 'Divya Menon', 10, 'CONFIRMED'],
        [6, day2, '15:00:00', '16:00:00', 'Maple Room', 'Vikram Singh', 4, 'CONFIRMED'],
        // Day 3
        [7, day3, '09:30:00', '10:30:00', 'Vega Room', 'Neha Gupta', 7, 'CONFIRMED'],
        [8, day3, '13:00:00', '14:00:00', 'Emerald Hall', 'Rohan Das', 12, 'CONFIRMED'],
        [9, day3, '17:00:00', '18:00:00', 'Lotus Pod', 'Anita Rao', 2, 'CONFIRMED'],
        // Day 4
        [10, day4, '10:00:00', '11:30:00', 'Sapphire Room', 'Sneha Reddy', 9, 'CONFIRMED'],
        [11, day4, '12:00:00', '13:00:00', 'Coral Room', 'Karan Mehta', 3, 'CONFIRMED'],
        [12, day4, '14:30:00', '15:30:00', 'Cloud Boardroom', 'Vikram Singh', 11, 'CANCELLED']
    ];
    
    // We import calculateCost
    const { calculateCost } = require('./utils/pricing');

    // We need room objects to pass to calculateCost
    const roomObjects = {};
    for (let i = 0; i < roomsData.length; i++) {
        const r = roomsData[i];
        roomObjects[r[0]] = {
            id: i + 1,
            name: r[0],
            pricing_type: r[4],
            price_per_hour: r[5],
            price_per_day: r[6]
        };
    }

    let nextMeetingId = 1;
    for (const slot of slots) {
        const [id, dayStr, startTimeStr, endTimeStr, roomName, orgName, people, status, extraParticipants] = slot;
        
        const rId = roomsMap[roomName];
        const orgId = usersMap[orgName];
        const startDT = `${dayStr} ${startTimeStr}`;
        const endDT = `${dayStr} ${endTimeStr}`;
        
        const roomObj = roomObjects[roomName];
        const costInfo = calculateCost(roomObj, startDT, endDT);
        
        meetingsData.push([
            `${orgName}'s Meeting`, 
            rId, 
            orgId, 
            startDT, 
            endDT, 
            people, 
            status,
            costInfo.totalCost, 
            costInfo.note
        ]);
        
        // Organizer is always participant
        participantsData.push([nextMeetingId, orgId]);
        
        // Extra participants
        if (extraParticipants) {
            for (const ep of extraParticipants) {
                participantsData.push([nextMeetingId, usersMap[ep]]);
            }
        }
        
        // Add Client (ID 5) so we can see these in the client's dashboard too for testing
        participantsData.push([nextMeetingId, 5]);
        
        // History rows
        historyData.push([nextMeetingId, 'CREATED', 'Meeting booked']);
        if (status === 'CANCELLED') {
            historyData.push([nextMeetingId, 'CANCELLED', 'User cancelled meeting']);
        }
        
        nextMeetingId++;
    }

    await pool.query(`INSERT INTO meetings (title, room_id, organizer_id, start_time, end_time, attendees, status, total_cost, price_note) VALUES ?`, [meetingsData]);
    await pool.query(`INSERT INTO meeting_participants (meeting_id, user_id) VALUES ?`, [participantsData]);
    await pool.query(`INSERT INTO meeting_history (meeting_id, action, details) VALUES ?`, [historyData]);

    console.log('✅ Backend Seed Complete — Applied 2.13-C SAMPLE SLOTS successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

runSeed();
