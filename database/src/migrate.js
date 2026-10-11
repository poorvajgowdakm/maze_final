/**
 * migrate.js — Runs schema.sql against the database.
 * Creates the database if it doesn't exist, then creates all tables.
 *
 * Usage: npm run migrate
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createRawConnection } = require('./config/db');

async function migrate() {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('🗄️  Running schema migration...');
  const connection = await createRawConnection();

  try {
    await connection.query(sql);
    console.log('✅ Schema migration completed successfully.');
    console.log('   Tables created: users, rooms, equipment, room_equipment,');
    console.log('   meetings, meeting_participants, meeting_equipment,');
    console.log('   meeting_history, room_ratings, chat_sessions');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
