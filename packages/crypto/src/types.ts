import { StringOutputFormat, Uint8ArrayOutputFormat } from "libsodium-wrappers";

export type OutputFormat = Uint8ArrayOutputFormat | StringOutputFormat;

export type Cipher = {
  format: OutputFormat;
  alg: string;
  cipher: string | Uint8Array;
  iv: string;
  salt: string;
  length: number;
};

export type Plaintext = {
  format: OutputFormat;
  data: string | Uint8Array;
};

export type SerializedKey = {
  password?: string;
  key?: string;
  salt?: string;
};

export type EncryptionKey = {
  key: Uint8Array;
  salt: string;
};

export type Chunk = {
  data: Uint8Array;
  final: boolean;
};
