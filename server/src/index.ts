import { createServer } from './server';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const app = await createServer();
    
    app.listen(PORT, () => {
      console.log(`🚀 Last-Lite server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
