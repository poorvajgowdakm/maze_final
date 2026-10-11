-- =============================================================
-- Meeting Room Scheduler — Full Database Schema
-- Engine: InnoDB (required for transactions and FOR UPDATE locking)
-- =============================================================

CREATE DATABASE IF NOT EXISTS room_scheduler;
USE room_scheduler;

-- Grant privileges for the app user
-- GRANT ALL ON room_scheduler.* TO 'app'@'localhost';

-- -----------------------------------------------------------
-- 1. Users
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('ADMIN','OWNER','USER') NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 2. Rooms
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  floor INT DEFAULT 0,
  capacity INT NOT NULL CHECK (capacity > 0),
  is_active TINYINT(1) DEFAULT 1,
  owner_id INT NULL,
  description TEXT NULL,
  address VARCHAR(255) NULL,
  pricing_type ENUM('FREE','HOURLY','DAILY','BOTH') NOT NULL DEFAULT 'FREE',
  price_per_hour DECIMAL(10,2) NULL,
  price_per_day DECIMAL(10,2) NULL,
  currency VARCHAR(5) NOT NULL DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 3. Equipment
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 4. Room ↔ Equipment (many-to-many)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_equipment (
  room_id INT NOT NULL,
  equipment_id INT NOT NULL,
  is_working TINYINT(1) DEFAULT 1,
  PRIMARY KEY (room_id, equipment_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 5. Meetings
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  room_id INT NOT NULL,
  organizer_id INT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  attendees INT NOT NULL,
  status ENUM('CONFIRMED','CANCELLED','COMPLETED') DEFAULT 'CONFIRMED',
  cancel_reason VARCHAR(255) NULL,
  cancelled_at DATETIME NULL,
  checkin_token VARCHAR(64) UNIQUE NULL,
  checked_in_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (organizer_id) REFERENCES users(id),
  CHECK (end_time > start_time),
  INDEX idx_room_time (room_id, start_time, end_time),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 6. Meeting ↔ Participants (many-to-many)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS meeting_participants (
  meeting_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (meeting_id, user_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 7. Meeting ↔ Equipment (many-to-many)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS meeting_equipment (
  meeting_id INT NOT NULL,
  equipment_id INT NOT NULL,
  PRIMARY KEY (meeting_id, equipment_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 8. Meeting History (audit log)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS meeting_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  action ENUM('CREATED','RESCHEDULED','CANCELLED','COMPLETED','CHECKED_IN') NOT NULL,
  details VARCHAR(255) NULL,
  action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 9. Room Ratings (added feature)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  room_id INT NOT NULL,
  user_id INT NOT NULL,
  score TINYINT NOT NULL CHECK (score BETWEEN 1 AND 10),
  issues VARCHAR(255) NULL,
  comment VARCHAR(200) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (meeting_id, user_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 10. Chat Sessions (RoomBot)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  pending_request JSON NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 11. Slot Locks (Temporary Reservations)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS slot_locks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lock_token VARCHAR(64) UNIQUE NOT NULL,
  room_id INT NOT NULL,
  user_id INT NOT NULL,
  participant_ids JSON NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;
