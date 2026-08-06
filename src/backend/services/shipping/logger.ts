import type { LoggerEvent, LogLevel } from './types';

const MAX_BUFFER_SIZE = 100;
const logBuffer: LoggerEvent[] = [];

export class ShiprocketLogger {
  private static createEvent(
    level: LogLevel,
    message: string,
    correlationId?: string,
    metadata?: Record<string, any>,
  ): LoggerEvent {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      metadata,
    };
  }

  private static push(event: LoggerEvent) {
    if (logBuffer.length >= MAX_BUFFER_SIZE) {
      logBuffer.shift();
    }
    logBuffer.push(event);

    const prefix = `[SHIPROCKET_${event.level}]`;
    const metaStr = event.metadata ? ` | Meta: ${JSON.stringify(event.metadata)}` : '';
    const corrStr = event.correlationId ? ` | CID: ${event.correlationId}` : '';
    const formatted = `${prefix} ${event.timestamp} - ${event.message}${corrStr}${metaStr}`;

    switch (event.level) {
      case 'ERROR':
        console.error(formatted);
        break;
      case 'WARN':
        console.warn(formatted);
        break;
      case 'METRIC':
        console.info(`📊 ${formatted}`);
        break;
      case 'AUDIT':
        console.info(`🔒 ${formatted}`);
        break;
      default:
        console.log(formatted);
        break;
    }
  }

  static info(message: string, correlationId?: string, metadata?: Record<string, any>) {
    this.push(this.createEvent('INFO', message, correlationId, metadata));
  }

  static warn(message: string, correlationId?: string, metadata?: Record<string, any>) {
    this.push(this.createEvent('WARN', message, correlationId, metadata));
  }

  static error(message: string, correlationId?: string, metadata?: Record<string, any>) {
    this.push(this.createEvent('ERROR', message, correlationId, metadata));
  }

  static metric(message: string, correlationId?: string, metadata?: Record<string, any>) {
    this.push(this.createEvent('METRIC', message, correlationId, metadata));
  }

  static audit(message: string, correlationId?: string, metadata?: Record<string, any>) {
    this.push(this.createEvent('AUDIT', message, correlationId, metadata));
  }

  static getRecentLogs(limit = 50): LoggerEvent[] {
    return logBuffer.slice(-limit);
  }

  static clearLogs() {
    logBuffer.length = 0;
  }
}
