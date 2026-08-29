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

function createMultiUploader({ fieldNames, uploadSubDir, maxSizeMb }) {
  return multer({
    storage: createStorage(uploadSubDir),
    fileFilter,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
  }).fields(fieldNames.map(name => ({ name, maxCount: 1 })));
}

const uploadPaymentScreenshot = createMultiUploader({
  fieldNames: ['paymentScreenshot', 'paymentScreenshot1', 'paymentScreenshot2', 'paymentScreenshot3'],
  uploadSubDir: 'payment-screenshots',
  maxSizeMb: 5,
});

const uploadRegistrantProfilePhoto = createUploader({
  fieldName: 'profilePhoto',
  uploadSubDir: 'profile-photos',
  maxSizeMb: 2,
});

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) or CSV files are allowed.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');

module.exports = {
  uploadPaymentScreenshot,
  uploadRegistrantProfilePhoto,
  uploadExcel,
};
