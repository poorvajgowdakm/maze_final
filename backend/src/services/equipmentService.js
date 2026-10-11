const { pool } = require('../config/db');

const getEquipmentList = async () => {
  const [equipment] = await pool.query('SELECT * FROM equipment');
  return equipment;
};

const createEquipment = async ({ name }) => {
  const [result] = await pool.query('INSERT INTO equipment (name) VALUES (?)', [name]);
  return { id: result.insertId, name };
};

const addEquipmentToRoom = async (roomId, equipmentId) => {
  await pool.query(
    'INSERT IGNORE INTO room_equipment (room_id, equipment_id, is_working) VALUES (?, ?, 1)',
    [roomId, equipmentId]
  );
  return { success: true };
};

const removeEquipmentFromRoom = async (roomId, equipmentId) => {
  await pool.query('DELETE FROM room_equipment WHERE room_id = ? AND equipment_id = ?', [roomId, equipmentId]);
  return { success: true };
};

const setEquipmentWorking = async (roomId, equipmentId, isWorking) => {
  await pool.query(
    'UPDATE room_equipment SET is_working = ? WHERE room_id = ? AND equipment_id = ?',
    [isWorking ? 1 : 0, roomId, equipmentId]
  );
  return { success: true };
};

module.exports = {
  getEquipmentList,
  createEquipment,
  addEquipmentToRoom,
  removeEquipmentFromRoom,
  setEquipmentWorking
};
