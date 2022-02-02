export type File = {
  filename: string;
  size: number;
  type: string;
  chunks: number;
  additionalData?: { [key: string]: any };
};
