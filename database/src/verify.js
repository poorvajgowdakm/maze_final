/**
 * verify.js — Verifies the database is set up correctly.
 * Checks that all tables exist and seed data is present.
 *
 * Usage: npm run verify
 */
require('dotenv').config();
const { pool } = require('./config/db');

const EXPECTED_TABLES = [
  'users',
  'rooms',
  'equipment',
  'room_equipment',
  'meetings',
  'meeting_participants',
  'meeting_equipment',
  'meeting_history',
  'room_ratings',
  'chat_sessions',
];

async function verify() {
  console.log('🔍 Verifying database setup...\n');
  let allPassed = true;

  try {
    // Check tables exist
    const [rows] = await pool.query('SHOW TABLES');
    const tableKey = Object.keys(rows[0])[0]; // e.g. "Tables_in_room_scheduler"
    const existingTables = rows.map((r) => r[tableKey]);

    console.log('📋 Table check:');
    for (const table of EXPECTED_TABLES) {
      const exists = existingTables.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
      if (!exists) allPassed = false;
    }

    // Check seed data counts
    console.log('\n📊 Seed data check:');
    const checks = [
      { table: 'users', expected: 6 },
      { table: 'rooms', expected: 4 },
      { table: 'equipment', expected: 4 },
      { table: 'room_equipment', expected: 9 },
    ];

    for (const { table, expected } of checks) {
      try {
        const [[{ count }]] = await pool.query(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        const ok = count >= expected;
        console.log(
          `   ${ok ? '✅' : '⚠️'} ${table}: ${count} rows (expected ≥ ${expected})`
        );
        if (!ok) allPassed = false;
      } catch {
        console.log(`   ❌ ${table}: could not query`);
        allPassed = false;
      }
    }

    // Check InnoDB engine
    console.log('\n⚙️  Engine check:');
    const [engines] = await pool.query(
      `SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [process.env.DB_NAME || 'room_scheduler']
    );
    for (const row of engines) {
      const ok = row.ENGINE === 'InnoDB';
      console.log(`   ${ok ? '✅' : '❌'} ${row.TABLE_NAME}: ${row.ENGINE}`);
      if (!ok) allPassed = false;
    }

    console.log(
      `\n${allPassed ? '✅ All checks passed!' : '⚠️  Some checks failed. Review above.'}`
    );
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  } finally {
    await pool.end();
  }
}

verify();
