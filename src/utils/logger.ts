export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type LogPayload = Record<string, unknown>;

function write(level: LogLevel, event: string, data?: LogPayload): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  };

  const line = JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

export const log = {
  info:  (event: string, data?: LogPayload) => write('info', event, data),
  warn:  (event: string, data?: LogPayload) => write('warn', event, data),
  error: (event: string, data?: LogPayload) => write('error', event, data),
  debug: (event: string, data?: LogPayload) => write('debug', event, data),
};
