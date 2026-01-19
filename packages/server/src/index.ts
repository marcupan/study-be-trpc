import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { createContext, prisma } from './trpc/context';
import { appRouter } from './trpc/routers';
import { validateEnv } from './utils/env';
import { logError, logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Validate environment variables
const env = validateEnv();

// Create Express app
const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production',
  })
);

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
app.use(
  cors({
    origin:
      env.NODE_ENV === 'production'
        ? (process.env['FRONTEND_URL'] ?? 'http://localhost:3000')
        : 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration.toString()}ms`,
      },
      'HTTP Request'
    );
  });
  next();
});

// Apply rate limiting to tRPC endpoint
app.use('/api/trpc', apiLimiter);

// tRPC API endpoint
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check endpoint with database status
app.get('/health', async (_, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: 'connected',
      environment: env.NODE_ENV,
    });
  } catch (error) {
    logError(error, 'Health check failed - database connection error');
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logError(err, `Unhandled error on ${req.method} ${req.url}`);
  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = parseInt(env.PORT, 10);
const server = app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      environment: env.NODE_ENV,
    },
    '🚀 Server started successfully'
  );
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    void prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    void prisma.$disconnect();
    process.exit(0);
  });
});

// Export type definition of API
export type { AppRouter } from './trpc/routers';
