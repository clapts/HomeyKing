export interface LogRecord {
  readonly timestamp: string;
  readonly level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  readonly component: string;
  readonly event: string;
  readonly message: string;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface Logger {
  write(record: LogRecord): void;
}

export class ConsoleLogger implements Logger {
  write(record: LogRecord): void {
    console.log(JSON.stringify(record));
  }
}
