export interface IBridge {
  createWritableStream(path: string): Promise<WritableStream>;
}
