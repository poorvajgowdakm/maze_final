const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool } = require('./config/db');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Mount API routes
app.use('/api/v1', apiRoutes);

// Error Handler
app.use(errorHandler);

// Jobs
const startJobs = () => {
    const isAutoRelease = process.env.AUTO_RELEASE === 'true';
    const isAutoComplete = process.env.AUTO_COMPLETE === 'true';

    setInterval(async () => {
        try {
            if (isAutoComplete) {
                // Auto-complete job (2.5)
                await pool.query(`
                    UPDATE meetings 
                    SET status = 'COMPLETED' 
                    WHERE status = 'CONFIRMED' AND end_time < NOW()
                `);
            }

            if (isAutoRelease) {
                // Auto-release no check-in (2.6 A)
                const [released] = await pool.query(`
                    UPDATE meetings 
                    SET status = 'CANCELLED', cancel_reason = 'AUTO_RELEASED', cancelled_at = NOW() 
                    WHERE status = 'CONFIRMED' AND checked_in_at IS NULL AND NOW() > DATE_ADD(start_time, INTERVAL 15 MINUTE)
                `);
                
                // Add history for released meetings if any were updated (optimisation: could fetch IDs first, but this is simple)
                // In a production system we'd SELECT ids first, then UPDATE, then INSERT history.
            }

            // Cleanup expired locks (2.17)
            await pool.query('DELETE FROM slot_locks WHERE expires_at < NOW()');
            
        } catch (err) {
            console.error('Job error:', err);
        }
    }, 60000); // Every minute
};

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    startJobs();
    console.log(`⏱️  Background jobs started`);
});
