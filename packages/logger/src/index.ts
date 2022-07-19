import { consoleReporter } from "./reporters/console";
import { ILogReporter, LoggerConfig, LogLevel } from "./types";

export class Logger {
  constructor(
    private readonly config: LoggerConfig = {
      reporter: consoleReporter,
      lastTime: Date.now(),
    }
  ) {}

  scope(scope: string) {
    return new Logger({ ...this.config, scope });
  }
  fatal = errorLogLevelFactory(LogLevel.Fatal, this.config);
  warn = logLevelFactory(LogLevel.Warn, this.config);
  debug = logLevelFactory(LogLevel.Debug, this.config);
  error = errorLogLevelFactory(LogLevel.Error, this.config);
  info = logLevelFactory(LogLevel.Info, this.config);
  log = logLevelFactory(LogLevel.Log, this.config);

  measure(tag: string) {
    performance.mark(tag);

    const marks = performance.getEntriesByName(tag, "mark");
    if (marks.length === 2) {
      const duration = marks[1].startTime - marks[0].startTime;
      this.info(`${tag} took ${duration.toFixed(2)}ms`);

      performance.clearMarks(tag);
    }
  }
}
export * from "./types";
export * from "./reporters";

function logLevelFactory(level: LogLevel, config: LoggerConfig) {
  return (message: string, extras?: Record<string, any>) => {
    const now = Date.now();
    config.reporter.write({
      level,
      message,
      timestamp: now,
      extras,
      scope: config.scope,
      elapsed: now - config.lastTime,
    });
    config.lastTime = now;
  };
}

function errorLogLevelFactory(level: LogLevel, config: LoggerConfig) {
  return (error: Error, message?: string, extras?: Record<string, any>) => {
    const now = Date.now();
    config.reporter.write({
      error,
      level,
      message: message || "",
      timestamp: now,
      extras,
      scope: config.scope,
      elapsed: now - config.lastTime,
    });
    config.lastTime = now;
  };
}

export function combineReporters(reporters: ILogReporter[]): ILogReporter {
  return {
    write(log) {
      for (const reporter of reporters) {
        reporter.write(log);
      }
    },
  };
}
