import {
  Cipher,
  EncryptionKey,
  OutputFormat,
  Plaintext,
  SerializedKey,
  Chunk
} from "./types";

export interface IStreamable {
  read(): Promise<Chunk | undefined>;
  write(chunk: Chunk | undefined): Promise<void>;
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

  deriveKey(password: string, salt?: string): Promise<EncryptionKey>;

  exportKey(password: string, salt?: string): Promise<SerializedKey>;

  encryptStream(
    key: SerializedKey,
    stream: IStreamable,
    streamId?: string
  ): Promise<string>;

  decryptStream(
    key: SerializedKey,
    iv: string,
    stream: IStreamable,
    streamId?: string
  ): Promise<void>;
}
