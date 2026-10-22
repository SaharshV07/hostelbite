import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { db } from './config/database';
import { runSeed } from './db/seed';

const PORT = process.env.PORT || 5000;

// Initialize Database & seed if empty
try {
  db.initSchema();
  const userCount = db.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM users`)?.count || 0;
  if (userCount === 0) {
    console.log('[HostelBite] Empty database detected. Populating with initial MUJ seed data...');
    runSeed();
  }
} catch (err) {
  console.error('[HostelBite] Database initialization error:', err);
}

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` HostelBite API Server running on http://localhost:${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});

export default server;
