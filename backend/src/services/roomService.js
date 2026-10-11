const { pool } = require('../config/db');

const getRooms = async (filters = {}) => {
  const { minCapacity, equipmentIds, isActive } = filters;
  
  let query = `
    SELECT r.*,
           (SELECT AVG(score) FROM room_ratings WHERE room_id = r.id) as averageScore,
           (SELECT COUNT(*) FROM room_ratings WHERE room_id = r.id) as ratingCount
    FROM rooms r
    WHERE 1=1
  `;
  const queryParams = [];

  if (isActive !== undefined) {
    query += ` AND r.is_active = ?`;
    queryParams.push(isActive === 'true' || isActive === 1 ? 1 : 0);
  }
  
  if (minCapacity) {
    query += ` AND r.capacity >= ?`;
    queryParams.push(Number(minCapacity));
  }

  const [rooms] = await pool.query(query, queryParams);

  // Get equipment for all rooms
  const [roomEquipments] = await pool.query(`
    SELECT re.room_id, e.id, e.name, re.is_working
    FROM room_equipment re
    JOIN equipment e ON re.equipment_id = e.id
  `);

  // Get photos for all rooms
  const [allPhotos] = await pool.query('SELECT * FROM room_photos ORDER BY sort_order ASC');

  rooms.forEach(r => {
    r.equipment = roomEquipments
      .filter(re => re.room_id === r.id)
      .map(re => ({ id: re.id, name: re.name, is_working: re.is_working }));
    r.averageScore = r.averageScore ? Number(Number(r.averageScore).toFixed(1)) : 0;
    
    const roomPhotos = allPhotos.filter(p => p.room_id === r.id);
    r.photos = roomPhotos.map(p => p.file_path);
    const coverPhotoObj = roomPhotos.find(p => p.is_cover === 1) || roomPhotos[0];
    r.coverPhoto = coverPhotoObj ? coverPhotoObj.file_path : null;
  });

  if (equipmentIds && equipmentIds.length > 0) {
    const reqEq = equipmentIds.map(Number);
    return rooms.filter(r => {
      const workingEqIds = r.equipment.filter(e => e.is_working).map(e => e.id);
      return reqEq.every(id => workingEqIds.includes(id));
    });
  }

  return rooms;
};

const getRoomById = async (id) => {
  const [rooms] = await pool.query(`
    SELECT r.*,
           (SELECT AVG(score) FROM room_ratings WHERE room_id = r.id) as averageScore,
           (SELECT COUNT(*) FROM room_ratings WHERE room_id = r.id) as ratingCount
    FROM rooms r WHERE r.id = ?
  `, [id]);
  
  if (rooms.length === 0) return null;
  const room = rooms[0];
  
  const [equipment] = await pool.query(`
    SELECT e.id, e.name, re.is_working
    FROM room_equipment re
    JOIN equipment e ON re.equipment_id = e.id
    WHERE re.room_id = ?
  `, [id]);
  
  const [photos] = await pool.query('SELECT * FROM room_photos WHERE room_id = ? ORDER BY sort_order ASC', [id]);

  room.equipment = equipment;
  room.averageScore = room.averageScore ? Number(Number(room.averageScore).toFixed(1)) : 0;
  room.photos = photos.map(p => p.file_path);
  const coverPhotoObj = photos.find(p => p.is_cover === 1) || photos[0];
  room.coverPhoto = coverPhotoObj ? coverPhotoObj.file_path : null;

  return room;
};

const createRoom = async ({ name, floor, capacity, is_active = 1, equipmentIds = [] }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO rooms (name, floor, capacity, is_active) VALUES (?, ?, ?, ?)',
      [name, floor, capacity, is_active]
    );
    const roomId = result.insertId;
    
    if (equipmentIds.length > 0) {
      const values = equipmentIds.map(eId => [roomId, eId, 1]);
      await conn.query('INSERT INTO room_equipment (room_id, equipment_id, is_working) VALUES ?', [values]);
    }
    await conn.commit();
    return getRoomById(roomId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const updateRoom = async (id, { name, floor, capacity, is_active, equipmentIds }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    let updates = [];
    let values = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (floor !== undefined) { updates.push('floor = ?'); values.push(floor); }
    if (capacity !== undefined) { updates.push('capacity = ?'); values.push(capacity); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }
    
    if (updates.length > 0) {
      values.push(id);
      await conn.query(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (equipmentIds !== undefined) {
      await conn.query('DELETE FROM room_equipment WHERE room_id = ?', [id]);
      if (equipmentIds.length > 0) {
        const insertValues = equipmentIds.map(eId => [id, eId, 1]);
        await conn.query('INSERT INTO room_equipment (room_id, equipment_id, is_working) VALUES ?', [insertValues]);
      }
    }
    
    await conn.commit();
    return getRoomById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const deactivateRoom = async (id) => {
  await pool.query('UPDATE rooms SET is_active = 0 WHERE id = ?', [id]);
  
  const [affectedMeetings] = await pool.query(`
    SELECT id, title, start_time, end_time 
    FROM meetings 
    WHERE room_id = ? AND status = 'CONFIRMED' AND start_time > NOW()
  `, [id]);
  
  return { deactivated: true, affectedMeetings };
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deactivateRoom
};
