declare module "aes-js" {
  export namespace ModeOfOperation {
    export class cbc {
      constructor(key: Uint8Array, iv: Uint8Array);
      decrypt(data: Uint8Array): number[];
    }
  }
}