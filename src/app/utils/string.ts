export function padLeft(n: any, amount: number, pad: string = '0'): string {
  let str = n + '';
  for (let i = str.length; i < amount; i++) {
    str = pad + str;
  }
  return str;
}

export function padRight(n: any, amount: number, pad: string = '0'): string {
  let str = n + '';
  for (let i = str.length; i < amount; i++) {
    str += pad;
  }
  return str;
}

export function hexStringToByte(str: string): Uint8Array {
  if (!str) {
    return new Uint8Array(0);
  }
  
  const a: number[] = [];
  const len = str.length;
  for (let i = 0; i < len; i += 2) {
    a.push(parseInt(str.substr(i,2), 16));
  }
  
  return new Uint8Array(a);
}