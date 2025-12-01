#!/usr/bin/env node
/**
 * Post-build script for admin dashboard
 * Renames index.admin.html to index.html for deployment
 */
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist-admin');
const adminHtmlPath = path.join(distPath, 'index.admin.html');
const indexHtmlPath = path.join(distPath, 'index.html');

// Check if index.admin.html exists
if (fs.existsSync(adminHtmlPath)) {
  console.log('✅ Found index.admin.html, renaming to index.html...');
  fs.renameSync(adminHtmlPath, indexHtmlPath);
  console.log('✅ Renamed successfully!');
} else if (fs.existsSync(indexHtmlPath)) {
  console.log('✅ index.html already exists, no action needed.');
} else {
  console.error('❌ Error: Neither index.admin.html nor index.html found in dist-admin/');
  process.exit(1);
}
