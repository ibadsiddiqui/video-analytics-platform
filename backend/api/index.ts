/**
 * Vercel Serverless Function Entry Point
 * Re-exports the NestJS app from main.ts
 */

import handler from '../dist/main';

export default handler;
