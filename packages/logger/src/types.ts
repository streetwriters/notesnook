export interface ILogReporter {
  write(message: LogMessage): void;
}

export enum LogLevel {
  Fatal,
  Error,
  Warn,
  Info,
  Debug,
  Log,
}

export type LogMessage = {
  error?: Error;
  timestamp: number;
  message: string;
  level: LogLevel;
  scope?: string;
  extras?: Record<string, any>;
  elapsed?: number;
};

export type LoggerConfig = {
  reporter: ILogReporter;
  lastTime: number;
  scope?: string;
};
