import { Worker } from './worker';
import { Logger } from './utils/logger';
import { Config } from './config';

const logger = Logger.getInstance();

async function main() {
  logger.info('Starting MCP-BD Crawler Worker', {
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    environment: Config.NODE_ENV,
  });

  try {
    const worker = new Worker();
    await worker.start();
  } catch (error) {
    logger.error('Failed to start worker', { error });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

if (require.main === module) {
  main();
}