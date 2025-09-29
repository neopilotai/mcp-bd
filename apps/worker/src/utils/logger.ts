import winston from 'winston';
import { Config } from '../config';

export class Logger {
  private static instance: winston.Logger;

  static getInstance(): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = winston.createLogger({
        level: Config.LOG_LEVEL,
        format: Config.LOG_FORMAT === 'json' 
          ? winston.format.combine(
              winston.format.timestamp(),
              winston.format.errors({ stack: true }),
              winston.format.json()
            )
          : winston.format.combine(
              winston.format.timestamp(),
              winston.format.errors({ stack: true }),
              winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message} ${
                  Object.keys(meta).length ? JSON.stringify(meta) : ''
                }`;
              })
            ),
        defaultMeta: { 
          service: 'mcp-bd-worker',
          workerId: Config.WORKER_ID,
        },
        transports: [
          new winston.transports.Console(),
        ],
      });

      // Add file transport in production
      if (Config.NODE_ENV === 'production') {
        Logger.instance.add(new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error' 
        }));
        Logger.instance.add(new winston.transports.File({ 
          filename: 'logs/combined.log' 
        }));
      }
    }

    return Logger.instance;
  }
}