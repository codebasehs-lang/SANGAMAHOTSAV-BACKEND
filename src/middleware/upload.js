const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function createStorage(uploadSubDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../../uploads', uploadSubDir);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      cb(null, unique);
    },
  });
}

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed.'));
  }
}

function createUploader({ fieldName, uploadSubDir, maxSizeMb }) {
  return multer({
    storage: createStorage(uploadSubDir),
    fileFilter,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
  }).single(fieldName);
}

const uploadPaymentScreenshot = createUploader({
  fieldName: 'paymentScreenshot',
  uploadSubDir: 'payment-screenshots',
  maxSizeMb: 5,
});

const uploadRegistrantProfilePhoto = createUploader({
  fieldName: 'profilePhoto',
  uploadSubDir: 'profile-photos',
  maxSizeMb: 2,
});

module.exports = { uploadPaymentScreenshot, uploadRegistrantProfilePhoto };
