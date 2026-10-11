const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const maxMb = parseInt(process.env.MAX_PHOTO_MB || '5', 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine subfolder based on route
    let folder = 'others';
    if (req.originalUrl.includes('/ratings')) folder = 'ratings';
    if (req.originalUrl.includes('/rooms') && req.originalUrl.includes('/photos')) folder = 'rooms';
    
    const dir = path.join(__dirname, '..', '..', uploadDir, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('VALIDATION_ERROR: Only image files are allowed (.jpg, .jpeg, .png, .webp)'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024 }, // MB to Bytes
  fileFilter
});

// Middleware to handle Multer errors properly
const handleUploadErrors = (middleware) => {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
           return res.status(400).json({ success: false, message: 'VALIDATION_ERROR', error: `File too large. Max ${maxMb}MB allowed.` });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
           return res.status(400).json({ success: false, message: 'VALIDATION_ERROR', error: `Too many files.` });
        }
        return res.status(400).json({ success: false, message: 'VALIDATION_ERROR', error: err.message });
      } else if (err) {
        return res.status(400).json({ success: false, message: 'VALIDATION_ERROR', error: err.message });
      }
      next();
    });
  };
};

module.exports = {
  uploadRatingPhotos: handleUploadErrors(upload.array('photos', parseInt(process.env.MAX_PHOTOS || '3', 10))),
  uploadRoomPhotos: handleUploadErrors(upload.array('photos', 10))
};
