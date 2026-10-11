/**
 * seed.js — Inserts demo data from seed.sql.
 * Run AFTER migrate.js has created the tables.
 *
 * Usage: npm run seed
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createRawConnection } = require('./config/db');

async function seed() {
  const seedPath = path.join(__dirname, '..', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  console.log('🌱 Seeding database...');
  const connection = await createRawConnection();

  try {
    await connection.query(sql);
    console.log('✅ Seed data inserted successfully.');
    console.log('   → 6 users, 4 rooms, 4 equipment types, 9 room-equipment links');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
