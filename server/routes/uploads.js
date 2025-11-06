/* eslint-env node */
const express = require('express');
const multer = require('multer');
let sharp;
let sharpAvailable = false;
try {
  sharp = require('sharp');
  sharpAvailable = true;
} catch {
  console.warn('sharp not available — image resizing disabled. Install sharp for thumbnails.');
  sharpAvailable = false;
}
const path = require('path');
const fs = require('fs');

const router = express.Router();

// ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB per file

// POST /api/uploads - accept multiple files, return array of URLs
router.post('/', upload.array('files', 8), (req, res) => {
  try {
    const host = req.get('host');
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const filesOut = [];
    // for each uploaded file, create a resized thumbnail if available
    (req.files || []).forEach((f) => {
      const originalUrl = `${protocol}://${host}/uploads/${f.filename}`;
      const baseName = f.filename.replace(/(\.[^.]+)$/, '');
      const thumbName = `${baseName}-thumb.jpg`;
      const thumbPath = path.join(uploadDir, thumbName);
      if (sharpAvailable) {
        try {
          sharp(f.path)
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(thumbPath)
            .catch((err) => console.error('Sharp resize error', err));
        } catch (err) {
          console.error('Sharp processing error', err);
        }
      } else {
        // if no sharp, copy original as thumb (cheap fallback)
        try {
          fs.copyFileSync(f.path, thumbPath);
        } catch (err) {
          console.error('Failed to copy file for thumb fallback', err);
        }
      }
      const thumbUrl = `${protocol}://${host}/uploads/${thumbName}`;
      filesOut.push({ original: originalUrl, thumb: thumbUrl });
    });
    // return array of original URLs for backward compatibility plus meta
    res.json({ files: filesOut.map(f => f.original), thumbs: filesOut.map(f => f.thumb), files_meta: filesOut });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

module.exports = router;
