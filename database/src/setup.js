/**
 * setup.js — Full setup: migrate + seed in one step.
 *
 * Usage: npm run setup   (or npm start)
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createRawConnection } = require('./config/db');

async function setup() {
  console.log('='.repeat(55));
  console.log(' Meeting Room Scheduler — Database Setup');
  console.log('='.repeat(55));

  const connection = await createRawConnection();

  try {
    // 1. Run schema
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('\n🗄️  Step 1/2: Running schema migration...');
    await connection.query(schemaSql);
    console.log('   ✅ All tables created.');

    // 2. Run seed
    const seedPath = path.join(__dirname, '..', 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('\n🌱 Step 2/2: Inserting seed data...');
    await connection.query(seedSql);
    console.log('   ✅ Demo data inserted.');

    console.log('\n' + '='.repeat(55));
    console.log(' ✅ Setup complete! Database "room_scheduler" is ready.');
    console.log('='.repeat(55));
    console.log('\nConnection details:');
    console.log(`  Host:     ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  Port:     ${process.env.DB_PORT || 3306}`);
    console.log(`  Database: ${process.env.DB_NAME || 'room_scheduler'}`);
    console.log(`  User:     ${process.env.DB_USER || 'root'}`);
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setup();
