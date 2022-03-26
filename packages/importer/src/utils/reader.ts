/**
 * Taken from https://github.com/coder/requirefs/blob/master/src/reader.ts
 * Read bytes from a Uint8Array.
 */
export class Reader {
  private _offset = 0;
  private currentClamp = 0;
  private textDecoder = new TextDecoder();

  public constructor(private readonly array: Uint8Array) {}

  public get offset(): number {
    return this._offset;
  }

  public skip(amount: number): this {
    this._offset += amount;
    return this;
  }

  public clamp(): void {
    this.currentClamp = this._offset;
  }

  public unclamp(): void {
    this.currentClamp = 0;
  }

  public jump(offset: number): this {
    this._offset = offset + this.currentClamp;
    return this;
  }

  public eof(): boolean {
    return this.offset >= this.array.length;
  }

  public peek(amount: number): Uint8Array;
  public peek(amount: number, encoding: "utf8"): string;
  public peek(amount: number, encoding?: "utf8"): Uint8Array | string {
    if (this.eof()) {
      throw new Error("EOF");
    }
    const data = this.array.slice(this.offset, this.offset + amount);
    // There may be nil bytes used as padding which we'll remove.
    return encoding
      ? this.textDecoder.decode(data.filter((byte) => byte !== 0x00))
      : data;
  }

  public read(amount: number): Uint8Array;
  public read(amount: number, encoding: "utf8"): string;
  public read(amount: number, encoding?: "utf8"): Uint8Array | string {
    const data = this.peek(amount, encoding as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    this._offset += amount;
    return data;
  }
}
