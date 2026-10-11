const express = require('express');
const { body, validationResult } = require('express-validator');
const { success, fail } = require('../utils/response');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { uploadRatingPhotos, uploadRoomPhotos } = require('../middleware/upload');

const authService = require('../services/authService');
const roomService = require('../services/roomService');
const equipmentService = require('../services/equipmentService');
const userService = require('../services/userService');
const meetingService = require('../services/meetingService');
const checkinService = require('../services/checkinService');
const roomBotService = require('../services/roomBotService');
const ratingService = require('../services/ratingService');
const lockService = require('../services/lockService');
const qrService = require('../services/qrService');
const ownerService = require('../services/ownerService');

const router = express.Router();

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return fail(res, 'VALIDATION_ERROR', errors.array()[0].msg, 400, errors.array());
    }
    next();
};

const requireOwnerOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'OWNER' || req.user.role === 'ADMIN')) {
        next();
    } else {
        return fail(res, 'FORBIDDEN', 'Requires owner privileges', 403);
    }
};

// --- Auth Routes ---
router.post('/auth/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters')
], validate, async (req, res, next) => {
    try {
        // Prevent users from setting themselves as ADMIN
        if (req.body.role === 'ADMIN') req.body.role = 'USER';
        const user = await authService.register(req.body);
        success(res, 'User registered successfully', user, 201);
    } catch (e) { next(e); }
});

router.post('/auth/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], validate, async (req, res, next) => {
    try {
        const data = await authService.login(req.body);
        success(res, 'Login successful', data);
    } catch (e) { next(e); }
});

router.get('/auth/me', requireLogin, async (req, res, next) => {
    try {
        const user = await authService.getMe(req.user.id);
        success(res, 'User fetched', user);
    } catch (e) { next(e); }
});

// --- Rooms ---
router.get('/rooms', requireLogin, async (req, res, next) => {
    try {
        let { minCapacity, equipmentIds, active } = req.query;
        if (equipmentIds) equipmentIds = equipmentIds.split(',');
        const rooms = await roomService.getRooms({ minCapacity, equipmentIds, isActive: active });
        success(res, 'Rooms fetched', rooms);
    } catch (e) { next(e); }
});

router.get('/rooms/free-now', requireLogin, async (req, res, next) => {
    try {
        const rooms = await meetingService.getFreeRoomsNow();
        success(res, 'Free rooms fetched', rooms);
    } catch (e) { next(e); }
});

router.get('/rooms/:id', requireLogin, async (req, res, next) => {
    try {
        const room = await roomService.getRoomById(req.params.id);
        if (!room) return fail(res, 'NOT_FOUND', 'Room not found', 404);
        success(res, 'Room fetched', room);
    } catch (e) { next(e); }
});

// Admin room routes left intact (can also use owner routes now)
router.post('/rooms', requireLogin, requireAdmin, async (req, res, next) => {
    try {
        const room = await roomService.createRoom(req.body);
        success(res, 'Room created', room, 201);
    } catch (e) { next(e); }
});

router.put('/rooms/:id', requireLogin, requireAdmin, async (req, res, next) => {
    try {
        const room = await roomService.updateRoom(req.params.id, req.body);
        success(res, 'Room updated', room);
    } catch (e) { next(e); }
});

router.patch('/rooms/:id/deactivate', requireLogin, requireAdmin, async (req, res, next) => {
    try {
        const result = await roomService.deactivateRoom(req.params.id);
        success(res, 'Room deactivated', result);
    } catch (e) { next(e); }
});

router.get('/rooms/:id/schedule', requireLogin, async (req, res, next) => {
    try {
        const schedule = await meetingService.getRoomSchedule(req.params.id, req.query.date);
        success(res, 'Schedule fetched', schedule);
    } catch (e) { next(e); }
});

router.get('/rooms/:id/ratings', requireLogin, async (req, res, next) => {
    try {
        const ratings = await ratingService.getRoomRatings(req.params.id);
        success(res, 'Ratings fetched', ratings);
    } catch (e) { next(e); }
});

// --- Owner Portal ---
router.post('/owner/rooms', requireLogin, requireOwnerOrAdmin, async (req, res, next) => {
    try {
        const result = await ownerService.createOwnerRoom(req.user.id, req.body);
        success(res, 'Room created', result, 201);
    } catch (e) { next(e); }
});

router.patch('/owner/rooms/:id/pricing', requireLogin, requireOwnerOrAdmin, async (req, res, next) => {
    try {
        await ownerService.setRoomPricing(req.user.id, req.params.id, req.body);
        success(res, 'Pricing updated');
    } catch (e) { next(e); }
});

router.post('/owner/rooms/:id/photos', requireLogin, requireOwnerOrAdmin, uploadRoomPhotos, async (req, res, next) => {
    try {
        let captions = [];
        if (req.body.captions) {
            captions = Array.isArray(req.body.captions) ? req.body.captions : [req.body.captions];
        }
        await ownerService.addRoomPhotos(req.user.id, req.params.id, req.files, captions);
        success(res, 'Photos added');
    } catch (e) { next(e); }
});

router.delete('/owner/rooms/photos/:photoId', requireLogin, requireOwnerOrAdmin, async (req, res, next) => {
    try {
        await ownerService.deleteRoomPhoto(req.user.id, req.params.photoId);
        success(res, 'Photo deleted');
    } catch (e) { next(e); }
});

router.get('/owner/earnings', requireLogin, requireOwnerOrAdmin, async (req, res, next) => {
    try {
        const earnings = await ownerService.getOwnerEarnings(req.user.id, req.query);
        success(res, 'Earnings fetched', earnings);
    } catch (e) { next(e); }
});


// --- Equipment ---
router.get('/equipment', requireLogin, async (req, res, next) => {
    try {
        const equipment = await equipmentService.getEquipmentList();
        success(res, 'Equipment fetched', equipment);
    } catch (e) { next(e); }
});

// --- Users ---
router.get('/users', requireLogin, async (req, res, next) => {
    try {
        const users = await userService.getUsers();
        success(res, 'Users fetched', users);
    } catch (e) { next(e); }
});

// --- Meetings ---
router.post('/meetings/check', requireLogin, async (req, res, next) => {
    try {
        const result = await meetingService.checkRequest(req.body);
        if (result.available) {
            success(res, 'Meeting confirmed.', result);
        } else {
            fail(res, result.problems[0].code, result.problems[0].message, 409, result);
        }
    } catch (e) { next(e); }
});

router.post('/meetings', requireLogin, async (req, res, next) => {
    try {
        const result = await meetingService.createMeeting(req.user.id, req.body);
        success(res, 'Meeting created successfully', result, 201);
    } catch (e) { next(e); }
});

router.get('/meetings', requireLogin, async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN') {
            req.query.userId = req.user.id;
        }
        const meetings = await meetingService.getMeetings(req.query);
        success(res, 'Meetings fetched', meetings);
    } catch (e) { next(e); }
});

router.patch('/meetings/:id/cancel', requireLogin, async (req, res, next) => {
    try {
        await meetingService.cancelMeeting(req.params.id, req.user.id, req.body.reason);
        success(res, 'Meeting cancelled');
    } catch (e) { next(e); }
});

router.post('/meetings/:id/ratings', requireLogin, uploadRatingPhotos, async (req, res, next) => {
    try {
        // Supports multipart form data now
        await ratingService.submitRating(req.params.id, req.user.id, req.body, req.files);
        success(res, 'Rating submitted');
    } catch (e) { next(e); }
});

// --- Admin ---
router.get('/ratings/issues', requireLogin, requireAdmin, async (req, res, next) => {
    try {
        const reports = await ratingService.getIssueReports();
        success(res, 'Issue reports fetched', reports);
    } catch (e) { next(e); }
});

router.patch('/ratings/:id/resolve', requireLogin, requireAdmin, async (req, res, next) => {
    try {
        await ratingService.resolveIssue(req.params.id, req.body.adminNote);
        success(res, 'Issue resolved');
    } catch (e) { next(e); }
});

// --- Lock ---
router.post('/meetings/lock', requireLogin, async (req, res, next) => {
    try {
        const { lockSlot } = require('../services/lockService');
        const { checkRoomAvailability, checkParticipantConflicts, checkCapacity, checkEquipment } = require('../services/availabilityService');
        const lock = await lockSlot(req.user.id, req.body, checkRoomAvailability, checkParticipantConflicts, checkCapacity, checkEquipment, req.body.attendees, req.body.requiredEquipmentIds);
        success(res, 'Slot locked', lock);
    } catch (e) { next(e); }
});

// --- Other ---
router.post('/checkin/:token', async (req, res, next) => {
    try {
        const result = await checkinService.checkIn(req.params.token);
        success(res, result.message, result);
    } catch (e) { next(e); }
});

router.post('/roombot/message', requireLogin, async (req, res, next) => {
    try {
        const result = await roomBotService.processMessage(req.body.sessionId, req.body.text, req.user.id);
        success(res, 'RoomBot reply', { reply: result });
    } catch (e) { next(e); }
});

module.exports = router;
