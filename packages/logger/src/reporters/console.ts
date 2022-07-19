import { ILogReporter, LogLevel, LogMessage } from "../types";

export const consoleReporter: ILogReporter = {
  write: (log) => {
    switch (log.level) {
      case LogLevel.Fatal:
        console.error(format(log));
        // TODO
        break;
      case LogLevel.Error:
        console.error(format(log));
        break;
      case LogLevel.Warn:
        console.warn(format(log));
        break;
      case LogLevel.Info:
        console.info(format(log));
        break;
      case LogLevel.Debug:
        console.debug(format(log));
        break;
      case LogLevel.Log:
        console.log(format(log));
        break;
    }
  },
};

type Token = {
  value?: string;
  separator?: " | " | " > " | ": ";
};
export function format(log: LogMessage) {
  const time = new Date(log.timestamp).toISOString();
  const tokens: Token[] = [
    { value: time, separator: " | " },
    { value: LogLevel[log.level].toUpperCase(), separator: " | " },
    { value: log.scope ? `[${log.scope}]` : "", separator: ": " },
    { value: log.message },
  ];

  if (log.extras) tokens.push({ value: JSON.stringify(log.extras) });

  tokens.push({ value: `[${log.elapsed}ms]` });

  let line = "";
  for (const token of tokens) {
    if (token.value) {
      line += token.value;
      if (token.separator) line += token.separator;
      else line += ` `;
    }
  }
  return line;
}
