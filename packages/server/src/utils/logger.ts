import pino from 'pino';

// eslint-disable-next-line @typescript-eslint/dot-notation
const isDevelopment = process.env['NODE_ENV'] === 'development';

export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Helper method for error logging
export const logError = (error: unknown, message?: string) => {
  if (error instanceof Error) {
    logger.error({ err: error, stack: error.stack }, message ?? error.message);
  } else {
    logger.error({ err: error }, message ?? 'Unknown error');
  }
};
