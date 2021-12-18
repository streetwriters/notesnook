import { File } from "./file";

export class TransformError extends Error {
  constructor(readonly message: string, readonly file: File) {
    super(message);
  }
}
