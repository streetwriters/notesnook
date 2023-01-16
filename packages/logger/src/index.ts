/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { consoleReporter } from "./reporters/console";
import { ILogReporter, LoggerConfig, LogLevel } from "./types";

type LogLevelFunc = (message: string, extras?: Record<string, unknown>) => void;
type ErrorLogLevelFunc = (
  error: Error,
  fallbackMessage?: string,
  extras?: Record<string, unknown>
) => void;
export interface ILogger {
  fatal: ErrorLogLevelFunc;
  warn: LogLevelFunc;
  debug: LogLevelFunc;
  error: ErrorLogLevelFunc;
  info: LogLevelFunc;
  log: LogLevelFunc;
  measure: (tag: string) => void;
  scope: (scope: string) => ILogger;
}

export class Logger implements ILogger {
  constructor(
    private readonly config: LoggerConfig = {
      reporter: consoleReporter,
      lastTime: Date.now()
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

export class NoopLogger implements ILogger {
  fatal() {}
  warn() {}
  debug() {}
  error() {}
  info() {}
  log() {}
  measure() {}
  scope() {
    return this;
  }
}

export * from "./types";
export * from "./reporters";

function logLevelFactory(level: LogLevel, config: LoggerConfig) {
  return (message: string, extras?: Record<string, unknown>) => {
    const now = Date.now();
    config.reporter.write({
      level,
      message,
      timestamp: now,
      extras,
      scope: config.scope,
      elapsed: now - config.lastTime
    });
    config.lastTime = now;
  };
}

function errorLogLevelFactory(level: LogLevel, config: LoggerConfig) {
  return (
    error: Error,
    fallbackMessage?: string,
    extras?: Record<string, unknown>
  ) => {
    const now = Date.now();
    config.reporter.write({
      level,
      message: error.stack
        ? error.stack.trim()
        : fallbackMessage
        ? fallbackMessage
        : "An error occurred.",
      timestamp: now,
      extras,
      scope: config.scope,
      elapsed: now - config.lastTime
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
    }
  };
}
