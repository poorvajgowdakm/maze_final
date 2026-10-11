# Meeting Room Scheduling & Conflict Resolver — 4-Laptop Build Guide

**Stack:** Frontend = React.js / Next.js · Backend = Node.js / Express.js · API = REST (JSON) · Database = MySQL
**Split:** Laptop 1 = Frontend · Laptop 2 = Backend · Laptop 3 = API · Laptop 4 = Database

---

## 0. SHARED CONTRACT (all 4 laptops must follow this exactly)

### 0.1 Ports and base URLs
| Part | Port | Base |
|---|---|---|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (Express) | 5000 | http://localhost:5000 |
| API prefix | – | `/api/v1` |
| MySQL | 3306 | DB name: `room_scheduler` |

### 0.2 Shared UI design system (identical on every laptop)
- **Theme:** clean, light, card-based dashboard.
- **Colors:** Primary `#2563EB` · Success/Confirmed `#16A34A` · Warning/Suggestion `#F59E0B` · Danger/Conflict/Cancelled `#DC2626` · Background `#F8FAFC` · Card `#FFFFFF` · Text `#0F172A` · Muted `#64748B` · Border `#E2E8F0`
- **Font:** Inter, sans-serif. Radius 12px cards, 8px buttons/inputs. Soft shadow `0 1px 3px rgba(0,0,0,.1)`.
- **Layout:** top navbar + left sidebar (desktop), collapsible sidebar (mobile).
- **Sidebar items (fixed order):** Dashboard · Book Meeting · Rooms & Equipment · Meetings · History
- **Status badge colors:** CONFIRMED green · CANCELLED red · COMPLETED grey · PENDING amber
- **Standard messages (same text everywhere):**
  - Conflict: "This slot is not available."
  - No alternatives: "No alternatives found. Try changing the time or equipment."
  - Success: "Meeting confirmed."
  - Cancel: "Meeting cancelled. Room is now free."

### 0.3 Core features (problem statement only)
1. Meeting creation (title, date, start, end, attendee count, participants, required equipment)
2. Room and equipment management (add/edit/disable rooms, equipment per room)
3. Availability checking (room + participants)
4. Participant/time conflict detection
5. Capacity matching (room capacity ≥ attendees)
6. Alternative suggestions (other rooms, other time slots)
7. Meeting status and history
8. Edge cases: room already booked · equipment unavailable · cancellation after booking frees the slot
9. Stretch: automatic room selection

### 0.4 Workflow (same on all parts)
1. User submits meeting request → 2. System checks participant + room availability → 3. Suitable rooms/time slots suggested → 4. Meeting confirmed → 5. Change/cancel updates availability.

### 0.5 Standard JSON response format
```json
{ "success": true, "message": "text", "data": {} }
{ "success": false, "message": "text", "error": "CODE", "data": null }
```
Error codes: `ROOM_CONFLICT`, `PARTICIPANT_CONFLICT`, `CAPACITY_EXCEEDED`, `EQUIPMENT_UNAVAILABLE`, `NOT_FOUND`, `VALIDATION_ERROR`.

### 0.6 Date/time rules
- Dates `YYYY-MM-DD`, times `HH:mm` (24h) in requests; stored as MySQL `DATETIME` (`start_time`, `end_time`).
- Overlap rule everywhere: `newStart < existingEnd AND newEnd > existingStart` (back-to-back meetings are NOT conflicts).
- Working hours for slot suggestion: 09:00–18:00, 30-minute steps.

---

## 1. FRONTEND (Laptop 1) — React.js / Next.js

### 1.1 Setup
```bash
npx create-next-app@latest frontend
cd frontend && npm i axios date-fns react-hot-toast
```
Create `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`
Use Tailwind CSS with the colors from section 0.2 added to `tailwind.config.js`.

### 1.2 Folder structure
```
/app
  /page.jsx                (Dashboard)
  /book/page.jsx           (Book Meeting)
  /rooms/page.jsx          (Rooms & Equipment)
  /meetings/page.jsx       (Meetings list)
  /history/page.jsx        (History)
/components
  Navbar.jsx  Sidebar.jsx  StatusBadge.jsx  RoomCard.jsx
  MeetingForm.jsx  AlternativesPanel.jsx  ConflictAlert.jsx
  RoomForm.jsx  EquipmentTag.jsx  MeetingTable.jsx  ConfirmModal.jsx
/lib/api.js                (axios instance, one function per endpoint)
```

### 1.3 Pages and what each shows
| Page | Content |
|---|---|
| **Dashboard** | Cards: today's meetings, rooms free now, cancelled today. Table of upcoming meetings. |
| **Book Meeting** | `MeetingForm` → on submit calls availability check. Shows result: green "available" with Confirm button, OR red `ConflictAlert` + `AlternativesPanel`. |
| **Rooms & Equipment** | Grid of `RoomCard` (name, floor, capacity, equipment tags, active/inactive). Add/Edit room modal. Add equipment, assign to rooms. |
| **Meetings** | Filter by status/date/room. `MeetingTable` with Cancel and Reschedule buttons. |
| **History** | Timeline of every action (created, rescheduled, cancelled) per meeting. |

### 1.4 MeetingForm fields
Title (required) · Date · Start time · End time · Number of attendees · Participants (multi-select users) · Required equipment (multi-select checkboxes: Projector, Whiteboard, Video Conferencing, Microphone, etc.) · Preferred room (optional dropdown) · Toggle **"Auto-select best room"** (stretch).
Validation: end > start, attendees ≥ 1, date not in the past.

### 1.5 Required UI behaviors
- **Room already booked:** show `ConflictAlert` (red) with message from 0.2, then auto-show alternatives.
- **Equipment unavailable:** show amber alert listing the missing equipment, then suggest rooms that have it.
- **AlternativesPanel:** two tabs — "Other Rooms (same time)" and "Other Time Slots (same room)". Each item is a card with a **Book this** button which fills the form and re-submits.
- **Cancel:** `ConfirmModal` → calls cancel API → toast "Meeting cancelled. Room is now free." → list refreshes.
- Loading spinners on all calls; toast on success/error (`react-hot-toast`).
- Responsive down to 360px.

### 1.6 API calls the frontend uses (see Section 3 for full contract)
`GET /rooms` · `POST /rooms` · `PUT /rooms/:id` · `GET /equipment` · `POST /equipment` · `GET /users` · `POST /meetings/check` · `POST /meetings` · `GET /meetings` · `PUT /meetings/:id` · `PATCH /meetings/:id/cancel` · `GET /meetings/:id/history` · `GET /dashboard/stats`

### 1.6b Demo script the UI must support
Create Meeting A (Room 1, 10:00–11:00) → create Meeting B overlapping (Room 1, 10:30–11:30) → conflict shown → alternative rooms/time slots shown → pick one → confirmed → cancel A → Room 1 shows free.

### 1.7 ADDED FEATURES — QR Check-in, RoomBot, Ratings (Frontend)

Install: `npm i react-hot-toast` (already installed). No QR library needed on the frontend, the backend returns the QR image. Use the same colors, cards, badges and toasts from section 0.2.

**New files**
```
/app/checkin/[token]/page.jsx     (QR landing page)
/app/roombot/page.jsx             (full chat page; also add "RoomBot" to the sidebar after "Meetings")
/components/QRCard.jsx  RoomBotChat.jsx  ChatBubble.jsx
/components/RatingForm.jsx  StarScore.jsx  IssueChips.jsx  RoomReviews.jsx
```

**A) QR generation / check-in**
- On the Meetings page and the "Meeting confirmed" screen, show a **QR Code** button per CONFIRMED meeting → opens `QRCard` modal with the QR image (from backend), meeting title, room, time, and a **Download QR** button (saves PNG).
- `QRCard` also shows a countdown: "Check in within 15 minutes of start or the room is released."
- `/checkin/[token]` page: on load calls the check-in endpoint, then shows a green success card ("Checked in. Enjoy your meeting.") or a red card for: already checked in, too early, expired/released ("Room was released because nobody checked in.").
- Meetings table gets a new column **Check-in** with badge: Checked In (green) · Waiting (amber) · Released (red).

**B) RoomBot (chat assistant)**
- Floating chat button (bottom-right, primary blue) on every page, opens `RoomBotChat` panel; also available full-page at `/roombot`.
- User types e.g. "Book a room for 8 people tomorrow at 3 PM with a projector". Show user bubble (blue, right) and bot bubble (white card, left) with a typing indicator while waiting.
- Bot reply types the frontend must render (by `reply.type` from backend):
  - `question` → plain text asking for missing info (e.g. duration), user answers in chat.
  - `suggestions` → list of room cards with a **Book this** quick-reply button.
  - `conflict` → red `ConflictAlert` style bubble + alternative rooms/time slots as buttons.
  - `confirmed` → green bubble with meeting summary and a **Show QR** button (opens `QRCard`).
- Keep chat history in React state; send `sessionId` (uuid in `localStorage`) with every message so the backend can remember the half-finished request.
- Quick-reply chips under the input: "Book a room for 4 people now", "Cancel my next meeting", "Which rooms are free now?".

**C) Ratings and reviews**
- After a meeting becomes COMPLETED, the Meetings and History pages show a **Rate this room** button → `RatingForm` modal:
  - Score from **1 to 10** (clickable 10-step `StarScore` bar; colors: 1–4 red, 5–7 amber, 8–10 green).
  - Issue chips (multi-select): Broken projector · Too small · Too noisy · Missing equipment · Dirty · Other (text box).
  - Optional comment (max 200 chars). Submit → toast "Thanks for your feedback."
  - One rating per user per meeting; if already rated, button shows "Rated" (disabled).
- `RoomCard` shows **average score (x.x / 10)** and review count. Clicking opens `RoomReviews` list (score, chips, comment, date).
- If the backend returns a flagged equipment item for a room, show a red "Needs attention" tag on that equipment's `EquipmentTag`.
- Booking form's room suggestions (`AlternativesPanel`) also show the average score on each room card.

**New API calls the frontend uses**
`GET /meetings/:id/qr` · `POST /checkin/:token` · `POST /roombot/message` · `POST /meetings/:id/ratings` · `GET /rooms/:id/ratings`

---

## 2. BACKEND (Laptop 2) — Node.js / Express.js

### 2.1 Setup
```bash
mkdir backend && cd backend && npm init -y
npm i express mysql2 cors dotenv express-validator dayjs
npm i -D nodemon
```
`.env`:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=room_scheduler
```

### 2.2 Folder structure
```
/src
  server.js            (express app, cors for http://localhost:3000, /api/v1 mount)
  /config/db.js        (mysql2 pool)
  /services
    availabilityService.js   (room + participant checks)
    suggestionService.js     (alternatives, ranking, auto-select)
    meetingService.js        (create, update, cancel, history)
  /utils/response.js   (success()/fail() helpers using format in 0.5)
  /middleware/errorHandler.js
```
Controllers/routes belong to the API laptop (Section 3); backend exposes the service functions below.

### 2.3 Business logic to implement
**a) `checkRoomAvailability(roomId, start, end, excludeMeetingId?)`**
```sql
SELECT COUNT(*) AS c FROM meetings
WHERE room_id = ? AND status = 'CONFIRMED'
  AND start_time < ? AND end_time > ?   -- (end, start)
  AND (? IS NULL OR id <> ?);
```
**b) `checkParticipantConflicts(userIds, start, end, excludeMeetingId?)`** — join `meeting_participants` with `meetings`, same overlap rule, return the clashing users and meeting titles.
**c) `checkCapacity(room, attendees)`** — `room.capacity >= attendees`.
**d) `checkEquipment(roomId, requiredEquipmentIds)`** — every required equipment must exist in `room_equipment` for that room and have `is_working = 1`. Return missing list.
**e) `findAlternativeRooms(request)`** — all active rooms where capacity, equipment and availability all pass; rank by smallest capacity difference (best fit first), return `matchScore` (0–100) and `reason` text.
**f) `findAlternativeSlots(roomId, date, durationMins, request)`** — scan 09:00–18:00 in 30-min steps on that date (and next working day if none), return first 5 slots where room AND all participants are free.
**g) `autoSelectRoom(request)`** (stretch) — return top-ranked room from (e).
**h) `createMeeting`** — run inside a **MySQL transaction** with `SELECT ... FOR UPDATE` on the room row to prevent double booking; re-run checks (a)–(d) inside the transaction; insert into `meetings`, `meeting_participants`, `meeting_equipment`; write history row `CREATED`.
**i) `updateMeeting`** — same checks excluding itself; history row `RESCHEDULED`.
**j) `cancelMeeting`** — set `status='CANCELLED'`, `cancelled_at=NOW()`, history row `CANCELLED`. Slot becomes free automatically because checks only count `CONFIRMED`.

### 2.4 Edge-case handling
| Case | Backend result |
|---|---|
| Room booked | `ROOM_CONFLICT` + alternatives (rooms and slots) |
| Participant busy | `PARTICIPANT_CONFLICT` + list of busy users + slot suggestions |
| Equipment missing | `EQUIPMENT_UNAVAILABLE` + missing items + rooms that have them |
| Capacity too small | `CAPACITY_EXCEEDED` + larger rooms |
| Cancelled meeting | Never counted in any availability check |

### 2.5 Auto-complete job
Every minute (`setInterval`), set `status='COMPLETED'` where `status='CONFIRMED' AND end_time < NOW()`.

### 2.6 ADDED FEATURES — QR Check-in, RoomBot, Ratings (Backend)

Install: `npm i qrcode uuid`

**Database additions the backend needs** (Laptop 4 must apply these to the schema)
```sql
ALTER TABLE meetings
  ADD COLUMN checkin_token VARCHAR(64) UNIQUE NULL,
  ADD COLUMN checked_in_at DATETIME NULL;

CREATE TABLE room_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  room_id INT NOT NULL,
  user_id INT NOT NULL,
  score TINYINT NOT NULL CHECK (score BETWEEN 1 AND 10),
  issues VARCHAR(255) NULL,          -- comma list: BROKEN_PROJECTOR,TOO_SMALL,TOO_NOISY,MISSING_EQUIPMENT,DIRTY,OTHER
  comment VARCHAR(200) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (meeting_id, user_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE chat_sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  pending_request JSON NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**New files**
```
/src/services/qrService.js        /src/services/checkinService.js
/src/services/roomBotService.js   /src/services/ratingService.js
```

**A) QR generation and check-in**
- In `createMeeting`, generate `checkin_token = uuid()` and store it.
- `generateQR(meetingId)`: build URL `http://localhost:3000/checkin/<token>`, return a PNG data URL using `QRCode.toDataURL(url, {width: 300})`.
- `checkIn(token)`:
  - Token not found → `NOT_FOUND`.
  - Meeting not CONFIRMED (cancelled/released) → error "Room was released because nobody checked in."
  - Already `checked_in_at` set → return "Already checked in."
  - Allowed window: from **10 minutes before start** until **15 minutes after start**. Outside it → `VALIDATION_ERROR` with message ("Too early" / "Check-in window closed").
  - Otherwise set `checked_in_at = NOW()` and add history row `CREATED` with details "Checked in".
- **Auto-release job** (extend the existing 1-minute job in 2.5): for meetings with `status='CONFIRMED' AND checked_in_at IS NULL AND NOW() > start_time + INTERVAL 15 MINUTE`, set `status='CANCELLED'`, `cancel_reason='AUTO_RELEASED'`, `cancelled_at=NOW()`, and write history row `CANCELLED` with details "Auto-released: no check-in". The slot becomes free automatically.

**B) RoomBot (rule-based, no external key needed)**
`processMessage(sessionId, text)` in `roomBotService.js`:
1. Load `pending_request` from `chat_sessions` (if any) and merge new info into it.
2. Extract fields with regex/`dayjs`:
   - attendees: `(\d+)\s*(people|persons|members|attendees)`
   - date: today, tomorrow, weekday names, or `YYYY-MM-DD`
   - start time: `(\d{1,2})(:\d{2})?\s*(am|pm)` (also 24h)
   - duration: `(\d+)\s*(hour|hr|min)` (default 60 min if not given)
   - equipment: match words against the `equipment` table names (projector, whiteboard, video, microphone)
3. Intents: **book**, **cancel** ("cancel my next meeting"), **free rooms now**, **fallback**.
4. If required fields (attendees, date, start time) are missing → reply `{type:"question", text:"..."}` and save partial request.
5. If complete → call `checkRoomAvailability`, `checkCapacity`, `checkEquipment`, `findAlternativeRooms`, `autoSelectRoom`:
   - Available → create meeting through `createMeeting`, reply `{type:"confirmed", meeting, qrUrl}`.
   - Not available → reply `{type:"conflict", alternativeRooms, alternativeSlots}`.
   - Several good rooms and user did not ask for auto-select → reply `{type:"suggestions", rooms}`.
6. Clear `pending_request` after confirmation or cancel.
Reply shape inside the standard `data` field: `{ "reply": { "type": "...", "text": "...", ... } }`.

**C) Ratings**
- `submitRating(meetingId, userId, {score, issues[], comment})`:
  - Meeting must be `COMPLETED` and the user must be a participant/organizer.
  - Score 1–10 integer; one rating per user per meeting (else `VALIDATION_ERROR` "Already rated").
  - Insert into `room_ratings`.
  - **Equipment flagging:** if `issues` contains `BROKEN_PROJECTOR`, set `room_equipment.is_working = 0` for that room's Projector (this makes `checkEquipment` exclude the room for projector requests automatically). Same rule for `MISSING_EQUIPMENT` → log only, no automatic change.
- `getRoomRatings(roomId)`: return `{average, count, reviews[]}`; average rounded to 1 decimal.
- **Ranking update:** in `findAlternativeRooms`, add `averageScore / 10 * 10` points to `matchScore` (max +10), and include `averageScore` in each returned room.
- Include `averageScore` and `ratingCount` in the room objects returned by room listings.
- Add `GET /meetings/:id/qr`, `POST /checkin/:token`, `POST /roombot/message`, `POST /meetings/:id/ratings`, `GET /rooms/:id/ratings` handlers (Laptop 3 wires these routes to the services above).

---

## 3. API (Laptop 3) — REST (Express routes + contract)

Base: `http://localhost:5000/api/v1` · All responses use format 0.5 · Use `express-validator` on every POST/PUT.
Files: `/src/routes/*.js` and `/src/controllers/*.js` calling backend services from Section 2.

### 3.1 Rooms
| Method | Endpoint | Body / Query | Returns |
|---|---|---|---|
| GET | `/rooms` | `?minCapacity=&equipmentIds=1,2&active=1` | list of rooms with equipment array |
| GET | `/rooms/:id` | – | single room |
| POST | `/rooms` | `{name, floor, capacity, equipmentIds:[]}` | created room |
| PUT | `/rooms/:id` | `{name, floor, capacity, is_active, equipmentIds:[]}` | updated room |
| GET | `/rooms/:id/availability` | `?date=YYYY-MM-DD` | booked and free slots that day |

### 3.2 Equipment
| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET | `/equipment` | – | all equipment |
| POST | `/equipment` | `{name}` | created |
| PATCH | `/room-equipment/:roomId/:equipmentId` | `{is_working: true/false}` | updated |

### 3.3 Users (participants)
| Method | Endpoint | Returns |
|---|---|---|
| GET | `/users` | `[{id, name, email}]` |

### 3.4 Meetings
| Method | Endpoint | Body | Returns |
|---|---|---|---|
| POST | `/meetings/check` | request body below | availability result + alternatives (does NOT save) |
| POST | `/meetings` | request body below | saved meeting, or conflict error with alternatives |
| GET | `/meetings` | `?status=&date=&roomId=` | list |
| GET | `/meetings/:id` | – | meeting + participants + equipment |
| PUT | `/meetings/:id` | request body below | rescheduled meeting |
| PATCH | `/meetings/:id/cancel` | `{reason?}` | cancelled meeting |
| GET | `/meetings/:id/history` | – | history entries |
| GET | `/history` | `?from=&to=` | all history |
| GET | `/dashboard/stats` | – | `{todayMeetings, freeRoomsNow, cancelledToday, upcoming:[]}` |

**Meeting request body**
```json
{
  "title": "Sprint Planning",
  "date": "2026-10-12",
  "startTime": "10:00",
  "endTime": "11:00",
  "attendees": 8,
  "participantIds": [1, 2, 5],
  "equipmentIds": [1, 3],
  "roomId": 2,
  "autoSelectRoom": false
}
```

**Success response (check)**
```json
{ "success": true, "message": "Meeting confirmed.",
  "data": { "available": true, "room": {"id":2,"name":"Room B"} } }
```

**Conflict response**
```json
{ "success": false, "error": "ROOM_CONFLICT", "message": "This slot is not available.",
  "data": {
    "conflicts": [{"type":"ROOM","meetingId":14,"title":"Design Review"}],
    "alternativeRooms": [{"id":3,"name":"Room C","capacity":10,"matchScore":92,"reason":"Fits 8 people, has Projector, free 10:00–11:00"}],
    "alternativeSlots": [{"roomId":2,"date":"2026-10-12","startTime":"11:00","endTime":"12:00"}]
  } }
```

### 3.5 HTTP status codes
200 OK · 201 created · 400 `VALIDATION_ERROR` · 404 `NOT_FOUND` · 409 any conflict error · 500 server error.

### 3.6 Testing
Provide a Postman/Thunder Client collection with: create overlapping meetings → expect 409 with alternatives → cancel first → re-book same slot → expect 201.

---

## 4. DATABASE (Laptop 4) — MySQL

### 4.1 Setup
```sql
CREATE DATABASE room_scheduler;
USE room_scheduler;
```

### 4.2 Schema (run in this order)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  floor INT DEFAULT 0,
  capacity INT NOT NULL CHECK (capacity > 0),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE room_equipment (
  room_id INT NOT NULL,
  equipment_id INT NOT NULL,
  is_working TINYINT(1) DEFAULT 1,
  PRIMARY KEY (room_id, equipment_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

CREATE TABLE meetings (
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (organizer_id) REFERENCES users(id),
  CHECK (end_time > start_time),
  INDEX idx_room_time (room_id, start_time, end_time),
  INDEX idx_status (status)
);

CREATE TABLE meeting_participants (
  meeting_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (meeting_id, user_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE meeting_equipment (
  meeting_id INT NOT NULL,
  equipment_id INT NOT NULL,
  PRIMARY KEY (meeting_id, equipment_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

CREATE TABLE meeting_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  action ENUM('CREATED','RESCHEDULED','CANCELLED','COMPLETED') NOT NULL,
  details VARCHAR(255) NULL,
  action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
```

### 4.3 Seed data (needed for demo)
```sql
INSERT INTO users (name,email) VALUES
('Asha','asha@corp.com'),('Ravi','ravi@corp.com'),('Meera','meera@corp.com'),
('Kiran','kiran@corp.com'),('Sana','sana@corp.com'),('Arjun','arjun@corp.com');

INSERT INTO rooms (name,floor,capacity) VALUES
('Room A',1,4),('Room B',1,8),('Room C',2,12),('Room D',2,20);

INSERT INTO equipment (name) VALUES
('Projector'),('Whiteboard'),('Video Conferencing'),('Microphone');

INSERT INTO room_equipment (room_id,equipment_id) VALUES
(1,2),(2,1),(2,2),(3,1),(3,2),(3,3),(4,1),(4,3),(4,4);
```

### 4.4 Key queries the database must support
```sql
-- Room conflict
SELECT id,title FROM meetings
WHERE room_id=? AND status='CONFIRMED' AND start_time < ? AND end_time > ?;

-- Participant conflict
SELECT u.name, m.title FROM meeting_participants mp
JOIN meetings m ON m.id=mp.meeting_id AND m.status='CONFIRMED'
JOIN users u ON u.id=mp.user_id
WHERE mp.user_id IN (?) AND m.start_time < ? AND m.end_time > ?;

-- Rooms matching capacity + ALL required equipment
SELECT r.* FROM rooms r
JOIN room_equipment re ON re.room_id=r.id AND re.is_working=1
WHERE r.is_active=1 AND r.capacity >= ? AND re.equipment_id IN (?)
GROUP BY r.id HAVING COUNT(DISTINCT re.equipment_id) = ?;

-- Free-room count now (dashboard)
SELECT COUNT(*) FROM rooms r WHERE r.is_active=1 AND NOT EXISTS (
  SELECT 1 FROM meetings m WHERE m.room_id=r.id AND m.status='CONFIRMED'
  AND NOW() BETWEEN m.start_time AND m.end_time);
```

### 4.5 Rules to enforce
- Use `InnoDB` engine (needed for transactions and `FOR UPDATE` locking).
- Never delete meetings; cancellation only changes `status` so history is preserved.
- Create a MySQL user for the app: `GRANT ALL ON room_scheduler.* TO 'app'@'localhost';`
- Export final DB as `schema.sql` and `seed.sql` and share with all laptops.

---

## 5. INTEGRATION CHECKLIST (when all 4 laptops are merged)

1. Laptop 4 shares `schema.sql` + `seed.sql` → everyone imports into local MySQL.
2. Laptop 2 + 3 merge into one `backend/` folder (services + routes/controllers) → `npm run dev` on port 5000.
3. Laptop 1 points `NEXT_PUBLIC_API_URL` to the backend → `npm run dev` on port 3000.
4. Test in order: rooms list loads → create meeting → overlapping meeting shows conflict + alternatives → book alternative → cancel → slot is free again.
5. Final folder:
```
project/
  frontend/   (Next.js)
  backend/    (Express: services, routes, controllers)
  database/   (schema.sql, seed.sql)
```
