export interface IHasher {
  type: string;
  hash(data: Uint8Array | Buffer): Promise<string>;
}

const encoder = new TextEncoder();
export function calculateHash(obj: any, hasher: IHasher): Promise<string> {
  return hasher.hash(encoder.encode(JSON.stringify(obj)));
}
