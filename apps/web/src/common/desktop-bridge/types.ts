/**
 * Interface definition for the Context Bridge API exposed by Electron.
 * This ensures safe type checking for renderer-process calls to main-process features
 * that circumvent standard nodeIntegration restrictions (like file system access).
 */
export interface IBridge {
  createWritableStream(path: string): Promise<WritableStream>;
}
