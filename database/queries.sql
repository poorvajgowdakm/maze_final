-- =============================================================
-- Meeting Room Scheduler — Key Queries Reference
-- These are the core queries the application relies on.
-- =============================================================

USE room_scheduler;

-- -----------------------------------------------------------
-- 1. Room Conflict Check
--    Overlap rule: newStart < existingEnd AND newEnd > existingStart
--    Back-to-back meetings are NOT conflicts.
--    Parameters: room_id, newEnd, newStart
-- -----------------------------------------------------------
-- SELECT id, title
-- FROM meetings
-- WHERE room_id = ?
--   AND status = 'CONFIRMED'
--   AND start_time < ?   -- newEnd
--   AND end_time > ?;    -- newStart


-- -----------------------------------------------------------
-- 2. Participant Conflict Check
--    Find users who already have a CONFIRMED meeting
--    that overlaps with the requested time slot.
--    Parameters: userIds[], newEnd, newStart
-- -----------------------------------------------------------
-- SELECT u.name, m.title
-- FROM meeting_participants mp
-- JOIN meetings m ON m.id = mp.meeting_id AND m.status = 'CONFIRMED'
-- JOIN users u ON u.id = mp.user_id
-- WHERE mp.user_id IN (?)
--   AND m.start_time < ?   -- newEnd
--   AND m.end_time > ?;    -- newStart


-- -----------------------------------------------------------
-- 3. Rooms Matching Capacity + ALL Required Equipment
--    Finds active rooms that have ALL requested equipment
--    and enough capacity.
--    Parameters: minCapacity, equipmentIds[], equipmentCount
-- -----------------------------------------------------------
-- SELECT r.*
-- FROM rooms r
-- JOIN room_equipment re ON re.room_id = r.id AND re.is_working = 1
-- WHERE r.is_active = 1
--   AND r.capacity >= ?
--   AND re.equipment_id IN (?)
-- GROUP BY r.id
-- HAVING COUNT(DISTINCT re.equipment_id) = ?;


-- -----------------------------------------------------------
-- 4. Free Room Count (Dashboard — right now)
--    Rooms that are active and have NO confirmed meeting
--    running at the current time.
-- -----------------------------------------------------------
-- SELECT COUNT(*) AS free_rooms
-- FROM rooms r
-- WHERE r.is_active = 1
--   AND NOT EXISTS (
--     SELECT 1
--     FROM meetings m
--     WHERE m.room_id = r.id
--       AND m.status = 'CONFIRMED'
--       AND NOW() BETWEEN m.start_time AND m.end_time
--   );


-- -----------------------------------------------------------
-- 5. Auto-release: Meetings with no check-in
--    CONFIRMED meetings where check-in window has passed
--    (15 minutes after start) and nobody checked in.
-- -----------------------------------------------------------
-- SELECT id
-- FROM meetings
-- WHERE status = 'CONFIRMED'
--   AND checked_in_at IS NULL
--   AND NOW() > DATE_ADD(start_time, INTERVAL 15 MINUTE);


-- -----------------------------------------------------------
-- 6. Auto-complete: Past confirmed meetings
--    CONFIRMED meetings whose end_time has passed.
-- -----------------------------------------------------------
-- SELECT id
-- FROM meetings
-- WHERE status = 'CONFIRMED'
--   AND end_time < NOW();
