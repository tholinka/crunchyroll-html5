function toHex(word: number): string {
  let hex = "";
  for (let i = 28; i >= 0; i -= 4) {
    hex += ((word >> i) & 0xf).toString(16);
  }
  return hex;
}

export class SHA1 {
  private _h0 = 0x67452301;
  private _h1 = 0xEFCDAB89;
  private _h2 = 0x98BADCFE;
  private _h3 = 0x10325476;
  private _h4 = 0xC3D2E1F0;

  private _length: number = 0;
  private _offset: number = 0;
  private _shift: number = 24;
  private _block = new Uint32Array(80);

  public digest(): string {
    // Pad
    this._write(0x80);
    if (this._offset > 14 || (this._offset === 14 && this._shift < 24)) {
      this._processBlock();
    }
    this._offset = 14;
    this._shift = 24;

    // 64-bit length big-endian
    this._write(0x00); // numbers this big aren't accurate in javascript anyway
    this._write(0x00); // ..So just hard-code to zero.
    this._write(this._length > 0xffffffffff ? this._length / 0x10000000000 : 0x00);
    this._write(this._length > 0xffffffff ? this._length / 0x100000000 : 0x00);
    for (let s = 24; s >= 0; s -= 8) {
      this._write(this._length >> s);
    }

    // At this point one last processBlock() should trigger and we can pull out the result.
    return toHex(this._h0) +
           toHex(this._h1) +
           toHex(this._h2) +
           toHex(this._h3) +
           toHex(this._h4);
  }

  public update(chunk: ArrayLike<number>): void {
    const length = chunk.length;
    this._length += length * 8;
    for (let i = 0; i < length; i++) {
      this._write(chunk[i]);
    }
  }

  private _write(byte: number): void {
    this._block[this._offset] |= (byte & 0xff) << this._shift;
    if (this._shift) {
      this._shift -= 8;
    }
    else {
      this._offset++;
      this._shift = 24;
    }
    if (this._offset === 16) this._processBlock();
  }

  private _processBlock() {
    // Extend the sixteen 32-bit words into eighty 32-bit words:
    for (let i = 16; i < 80; i++) {
      const w = this._block[i - 3] ^ this._block[i - 8] ^ this._block[i - 14] ^ this._block[i - 16];
      this._block[i] = (w << 1) | (w >>> 31);
    }

    // Initialize hash value for this chunk:
    let a = this._h0;
    let b = this._h1;
    let c = this._h2;
    let d = this._h3;
    let e = this._h4;
    let f;
    let k;

    // Main loop:
    for (let i = 0; i < 80; i++) {
      if (i < 20) {
        f = d ^ (b & (c ^ d));
        k = 0x5A827999;
      }
      else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ED9EBA1;
      }
      else if (i < 60) {
        f = (b & c) | (d & (b | c));
        k = 0x8F1BBCDC;
      }
      else {
        f = b ^ c ^ d;
        k = 0xCA62C1D6;
      }
      const temp = (a << 5 | a >>> 27) + f + e + k + (this._block[i]|0);
      e = d;
      d = c;
      c = (b << 30 | b >>> 2);
      b = a;
      a = temp;
    }

    // Add this chunk's hash to result so far:
    this._h0 = (this._h0 + a) | 0;
    this._h1 = (this._h1 + b) | 0;
    this._h2 = (this._h2 + c) | 0;
    this._h3 = (this._h3 + d) | 0;
    this._h4 = (this._h4 + e) | 0;

    // The block is now reusable.
    this._offset = 0;
    for (let i = 0; i < 16; i++) {
      this._block[i] = 0;
    }
  }
}
