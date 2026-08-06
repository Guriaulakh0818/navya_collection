export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

export class Logger {
  private static formatEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || 'Application',
      data: data || undefined,
    };
  }

  static info(message: string, context?: string, data?: any) {
    const entry = this.formatEntry('INFO', message, context, data);
    console.log(JSON.stringify(entry));
  }

  static warn(message: string, context?: string, data?: any) {
    const entry = this.formatEntry('WARN', message, context, data);
    console.warn(JSON.stringify(entry));
  }

  static error(message: string, context?: string, errorData?: any) {
    const entry = this.formatEntry('ERROR', message, context, errorData);
    console.error(JSON.stringify(entry));
  }

  static audit(action: string, entity: string, entityId?: string, details?: any) {
    const entry = this.formatEntry('AUDIT', `Audit Log: ${action} on ${entity}`, 'Security', {
      action,
      entity,
      entityId,
      details,
    });
    console.log(JSON.stringify(entry));
  }
}
