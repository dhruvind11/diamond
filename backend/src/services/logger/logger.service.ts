// src/utils/logger.ts
import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const now = new Date();
const currentMonth = now.getMonth() + 1;
const finalMonth = ('0' + currentMonth).slice(-2);
const todayFileName = now.getFullYear() + '-' + finalMonth + '-' + now.getDate();

const logger = createLogger({
  level: 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  transports: [
    new transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
    }),
    new transports.File({
      filename: path.join('logs', `${todayFileName}.log`),
    }),
  ],
});

logger.add(
  new transports.Console({
    format: format.simple(),
  })
);

export default logger;
