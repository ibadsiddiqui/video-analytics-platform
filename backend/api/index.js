/**
 * Vercel Serverless Function
 * Entry point for all API requests
 */

const path = require('path');

// Try to load the NestJS app from api/dist (copied during build)
let handler;
try {
  const mainModule = require(path.join(__dirname, 'dist', 'main.js'));
  handler = mainModule.default || mainModule;

  if (!handler) {
    throw new Error('No default export found in main.js');
  }
} catch (error) {
  console.error('Error loading NestJS app:', error);
  handler = async (req, res) => {
    res.status(500).json({
      error: 'Failed to load NestJS app',
      message: error.message,
      stack: error.stack,
      __dirname,
      cwd: process.cwd()
    });
  };
}

module.exports = handler;
