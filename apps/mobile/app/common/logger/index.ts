function info(context: string, ...logs: any[]) {
  console.log(`${new Date().toLocaleDateString()}::info::${context}:`, ...logs);
}

function error(context: string, ...logs: any[]) {
  console.log(`${new Date().toLocaleDateString()}::error::${context}: `, ...logs);
}

type Logger = {
  info: (context: string, ...logs: any[]) => void;
  error: (context: string, ...logs: any[]) => void;
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
