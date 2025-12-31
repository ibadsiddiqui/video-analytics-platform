/**
 * Video Analytics Platform - Backend API Server
 * TypeScript + Clean Architecture + TypeDI + routing-controllers
 */

import { App } from './App';

// Create and start the application
const app = new App();
app.start();

// Export for Vercel serverless
export default app.getApp();
