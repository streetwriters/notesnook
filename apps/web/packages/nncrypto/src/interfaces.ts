import { Chunk } from "streamablefs/dist/src/types";
import {
  Cipher,
  EncryptionKey,
  OutputFormat,
  Plaintext,
  SerializedKey,
} from "./types";

export interface IStreamable {
  read(): Promise<Chunk | undefined>;
  write(chunk: Uint8Array): Promise<void>;
}

export interface INNCrypto {
  encrypt(
    key: SerializedKey,
    plaintext: Plaintext,
    outputFormat?: OutputFormat
  ): Promise<Cipher>;

  decrypt(
    key: SerializedKey,
    cipherData: Cipher,
    outputFormat?: OutputFormat
  ): Promise<Plaintext>;

  hash(password: string, salt: string): Promise<string>;

  deriveKey(password: string, salt: string): Promise<EncryptionKey>;

  exportKey(password: string, salt: string): Promise<string>;

  encryptStream(
    key: SerializedKey,
    stream: IStreamable,
    filename?: string
  ): Promise<string>;
}
