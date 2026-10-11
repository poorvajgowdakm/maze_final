/**
 * reset.js — Drops and recreates the entire database.
 * WARNING: This destroys all data!
 *
 * Usage: npm run reset
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createRawConnection } = require('./config/db');

async function reset() {
  const dbName = process.env.DB_NAME || 'room_scheduler';

  console.log(`⚠️  Dropping database "${dbName}"...`);
  const connection = await createRawConnection();

  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`   Database "${dbName}" dropped.`);

    // Re-run schema
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('\n🗄️  Recreating schema...');
    await connection.query(schemaSql);
    console.log('   ✅ Schema recreated.');

    // Re-run seed
    const seedPath = path.join(__dirname, '..', 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('\n🌱 Re-seeding data...');
    await connection.query(seedSql);
    console.log('   ✅ Seed data inserted.');

    console.log('\n✅ Database reset complete!');
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

reset();
