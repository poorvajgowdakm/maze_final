const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

const checkOwner = async (ownerId, roomId, connection = pool) => {
    const [rooms] = await connection.query('SELECT owner_id FROM rooms WHERE id = ?', [roomId]);
    if (rooms.length === 0) throw new Error('NOT_FOUND: Room not found');
    if (rooms[0].owner_id !== ownerId) throw new Error('FORBIDDEN: You do not own this room');
};

const createOwnerRoom = async (ownerId, request) => {
    const { name, floor=0, capacity, description, address, pricing_type='FREE', price_per_hour, price_per_day, equipmentIds=[] } = request;
    
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query(
            `INSERT INTO rooms (name, floor, capacity, owner_id, description, address, pricing_type, price_per_hour, price_per_day) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, floor, capacity, ownerId, description, address, pricing_type, price_per_hour, price_per_day]
        );
        const roomId = result.insertId;

        if (equipmentIds.length > 0) {
            const values = equipmentIds.map(eId => [roomId, eId, 1]);
            await conn.query('INSERT INTO room_equipment (room_id, equipment_id, is_working) VALUES ?', [values]);
        }
        await conn.commit();
        return { roomId };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const setRoomPricing = async (ownerId, roomId, { pricing_type, price_per_hour, price_per_day }) => {
    await checkOwner(ownerId, roomId);
    
    // Validation
    if (pricing_type === 'HOURLY' && (!price_per_hour || price_per_hour <= 0)) throw new Error('VALIDATION_ERROR: Hourly price required');
    if (pricing_type === 'DAILY' && (!price_per_day || price_per_day <= 0)) throw new Error('VALIDATION_ERROR: Daily price required');
    if (pricing_type === 'BOTH') {
        if (!price_per_hour || !price_per_day) throw new Error('VALIDATION_ERROR: Both prices required');
        if (price_per_day > price_per_hour * 9) throw new Error('VALIDATION_ERROR: Day price is higher than hourly total');
    }

    const p_hour = pricing_type === 'FREE' ? null : price_per_hour;
    const p_day = pricing_type === 'FREE' ? null : price_per_day;

    await pool.query(
        'UPDATE rooms SET pricing_type=?, price_per_hour=?, price_per_day=? WHERE id=?',
        [pricing_type, p_hour, p_day, roomId]
    );
    return { success: true };
};

const addRoomPhotos = async (ownerId, roomId, files, captions = []) => {
    await checkOwner(ownerId, roomId);
    if (!files || files.length === 0) return { success: true };

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[{ count }]] = await conn.query('SELECT COUNT(*) as count FROM room_photos WHERE room_id = ?', [roomId]);
        
        let currentCount = count;
        for (let i = 0; i < files.length; i++) {
            if (currentCount >= 10) {
                // Delete remaining files
                for (let j = i; j < files.length; j++) fs.unlinkSync(files[j].path);
                throw new Error('VALIDATION_ERROR: Max 10 photos per room');
            }
            const isCover = currentCount === 0 ? 1 : 0;
            const caption = captions[i] || null;
            const urlPath = `/uploads/rooms/${files[i].filename}`;
            await conn.query(
                'INSERT INTO room_photos (room_id, file_path, caption, is_cover, sort_order) VALUES (?, ?, ?, ?, ?)',
                [roomId, urlPath, caption, isCover, currentCount]
            );
            currentCount++;
        }
        await conn.commit();
        return { success: true };
    } catch (err) {
        await conn.rollback();
        files.forEach(f => {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
        throw err;
    } finally {
        conn.release();
    }
};

const deleteRoomPhoto = async (ownerId, photoId) => {
    const [photos] = await pool.query('SELECT r.owner_id, p.file_path, p.room_id FROM room_photos p JOIN rooms r ON p.room_id = r.id WHERE p.id = ?', [photoId]);
    if (photos.length === 0) throw new Error('NOT_FOUND');
    if (photos[0].owner_id !== ownerId) throw new Error('FORBIDDEN');

    await pool.query('DELETE FROM room_photos WHERE id = ?', [photoId]);
    
    const absolutePath = path.join(__dirname, '..', '..', photos[0].file_path);
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    return { success: true };
};

const getOwnerEarnings = async (ownerId, { dateFrom, dateTo }) => {
    // Basic implementation
    let queryCompleted = `
        SELECT SUM(m.total_cost) as totalEarned 
        FROM meetings m JOIN rooms r ON m.room_id = r.id 
        WHERE r.owner_id = ? AND m.status = 'COMPLETED'
    `;
    let queryUpcoming = `
        SELECT SUM(m.total_cost) as upcomingValue 
        FROM meetings m JOIN rooms r ON m.room_id = r.id 
        WHERE r.owner_id = ? AND m.status = 'CONFIRMED'
    `;
    let params = [ownerId];
    if (dateFrom && dateTo) {
        queryCompleted += ` AND m.start_time BETWEEN ? AND ?`;
        queryUpcoming += ` AND m.start_time BETWEEN ? AND ?`;
        params.push(dateFrom, dateTo);
    }
    
    const [[{ totalEarned }]] = await pool.query(queryCompleted, params);
    const [[{ upcomingValue }]] = await pool.query(queryUpcoming, params);

    return { 
        totalEarned: Number(totalEarned || 0), 
        upcomingValue: Number(upcomingValue || 0) 
    };
};

module.exports = {
    createOwnerRoom,
    setRoomPricing,
    addRoomPhotos,
    deleteRoomPhoto,
    getOwnerEarnings
};
