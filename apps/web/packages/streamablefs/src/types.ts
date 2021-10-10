export type File = {
  filename: string;
  size: number;
  type: string;
  chunks: number;
  additionalData?: { [key: string]: any };
};

export type Chunk = {
  data: Uint8Array;
  final: boolean;
};
