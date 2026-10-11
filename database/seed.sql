-- =============================================================
-- Meeting Room Scheduler — Seed Data for Demo
-- =============================================================

USE room_scheduler;

-- -----------------------------------------------------------
-- Users (6 demo employees)
-- -----------------------------------------------------------
INSERT INTO users (name, email) VALUES
  ('Asha',  'asha@corp.com'),
  ('Ravi',  'ravi@corp.com'),
  ('Meera', 'meera@corp.com'),
  ('Kiran', 'kiran@corp.com'),
  ('Sana',  'sana@corp.com'),
  ('Arjun', 'arjun@corp.com');

-- -----------------------------------------------------------
-- Rooms (4 meeting rooms across 2 floors)
-- -----------------------------------------------------------
INSERT INTO rooms (name, floor, capacity) VALUES
  ('Room A', 1,  4),
  ('Room B', 1,  8),
  ('Room C', 2, 12),
  ('Room D', 2, 20);

-- -----------------------------------------------------------
-- Equipment (4 types)
-- -----------------------------------------------------------
INSERT INTO equipment (name) VALUES
  ('Projector'),
  ('Whiteboard'),
  ('Video Conferencing'),
  ('Microphone');

-- -----------------------------------------------------------
-- Room ↔ Equipment assignments
--   Room A: Whiteboard
--   Room B: Projector, Whiteboard
--   Room C: Projector, Whiteboard, Video Conferencing
--   Room D: Projector, Video Conferencing, Microphone
-- -----------------------------------------------------------
INSERT INTO room_equipment (room_id, equipment_id) VALUES
  (1, 2),
  (2, 1), (2, 2),
  (3, 1), (3, 2), (3, 3),
  (4, 1), (4, 3), (4, 4);
