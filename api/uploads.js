/* eslint-env node */
const path = require('path');
const fs = require('fs');

/**
 * Serverless function to serve uploaded files
 * Note: In production, consider using Vercel Blob or external storage like Supabase Storage
 */
module.exports = (req, res) => {
  // Extract the file path from the URL
  const filePath = req.url.replace('/uploads/', '');
  const fullPath = path.join(__dirname, '..', 'server', 'public', 'uploads', filePath);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Get file extension to set proper content type
  const ext = path.extname(fullPath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf'
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';
  
  // Read and send the file
  const fileStream = fs.createReadStream(fullPath);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  fileStream.pipe(res);
};
