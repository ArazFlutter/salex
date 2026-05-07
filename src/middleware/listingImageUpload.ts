import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { randomBytes } from 'crypto';
import { AppError } from '../utils/AppError';

const uploadsDir = path.join(process.cwd(), 'uploads');

function ensureUploadsDir(): void {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureUploadsDir();
      cb(null, uploadsDir);
    } catch (e) {
      cb(e as Error, uploadsDir);
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = /^\.[a-z0-9]{1,8}$/i.test(ext) ? ext : '.bin';
    cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}${safeExt}`);
  },
});

export const listingImageUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image uploads are allowed', 400));
    }
  },
});
