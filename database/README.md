# Meeting Room Scheduler — Database

## Quick Start

1. **Install dependencies:**
   ```bash
   cd database
   npm install
   ```

2. **Configure** — Update `.env` with your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=room_scheduler
   ```

3. **Run full setup** (creates database + tables + seed data):
   ```bash
   npm start
   ```

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Full setup: create DB → tables → seed data |
| `npm run migrate` | Run schema.sql only (create/update tables) |
| `npm run seed` | Insert demo seed data only |
| `npm run reset` | ⚠️ Drop and recreate everything from scratch |
| `npm run verify` | Check all tables exist with correct data |
| `npm run build` | Copy files to dist/ for distribution |

## Database Schema

10 tables using **InnoDB** engine:

| Table | Purpose |
|---|---|
| `users` | Employee/participant directory |
| `rooms` | Meeting rooms with floor and capacity |
| `equipment` | Equipment types (Projector, Whiteboard, etc.) |
| `room_equipment` | Which equipment is in which room |
| `meetings` | Booked meetings with status tracking |
| `meeting_participants` | Meeting ↔ User assignments |
| `meeting_equipment` | Equipment requested per meeting |
| `meeting_history` | Audit log of all meeting actions |
| `room_ratings` | Post-meeting room ratings (1–10) |
| `chat_sessions` | RoomBot conversation state |

## Seed Data

- **6 users:** Asha, Ravi, Meera, Kiran, Sana, Arjun
- **4 rooms:** Room A (4 cap), Room B (8), Room C (12), Room D (20)
- **4 equipment types:** Projector, Whiteboard, Video Conferencing, Microphone
- **9 room-equipment links**

## Rules

- All tables use **InnoDB** (required for transactions and `FOR UPDATE` locking)
- Meetings are **never deleted** — cancellation changes `status` to preserve history
- Overlap rule: `newStart < existingEnd AND newEnd > existingStart` (back-to-back is OK)
- Working hours for suggestions: 09:00–18:00, 30-minute steps

## Files

```
database/
├── .env                  # MySQL connection config
├── .gitignore
├── package.json
├── README.md
├── schema.sql            # Full table definitions
├── seed.sql              # Demo data
├── queries.sql           # Key query reference
├── scripts/
│   └── build.js          # Copies to dist/
├── src/
│   ├── config/
│   │   └── db.js         # mysql2 connection pool
│   ├── migrate.js        # Schema runner
│   ├── seed.js           # Seed runner
│   ├── setup.js          # Combined migrate + seed
│   ├── reset.js          # Drop + recreate
│   └── verify.js         # Health check
├── dist/                 # Built output (after npm run build)
└── node_modules/         # Dependencies (after npm install)
```
