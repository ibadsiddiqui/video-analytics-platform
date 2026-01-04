/**
 * Vercel Serverless Function
 * Entry point for all API requests
 */

const handler = require('../dist/main').default;

module.exports = handler;
