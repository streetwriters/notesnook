function info(context: string, ...logs: unknown[]) {
  console.log(`${new Date().toLocaleDateString()}::info::${context}:`, ...logs);
}

function error(context: string, ...logs: unknown[]) {
  console.log(
    `${new Date().toLocaleDateString()}::error::${context}: `,
    ...logs
  );
}

type Logger = {
  info: (context: string, ...logs: unknown[]) => void;
  error: (context: string, ...logs: unknown[]) => void;
};

declare global {
  // eslint-disable-next-line no-var
  var logger: Logger;
}

global.logger = {
  info,
  error
};

export {};
