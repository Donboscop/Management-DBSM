import app from './app';
import { seedDatabase } from './seed';

const PORT = process.env.PORT || 3005;

async function start() {
  try {
    app.listen(PORT, () => {
      console.log(`\n========================================================`);
      console.log(`🚀 DBSM Backend API Server listening on port ${PORT}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   Database    : Neon PostgreSQL (Live Cloud)`);
      console.log(`========================================================\n`);
    });
    // Ensure initial seed data exists
    seedDatabase().catch((err) => console.error('Seed error:', err));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
