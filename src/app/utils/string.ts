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
    a.push(parseInt(str.substr(i, 2), 16));
  }

  return new Uint8Array(a);
}

export function uuidv4() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, s => {
    const c = parseInt(s, 10);
    // tslint:disable-next-line:no-bitwise
    return (
      c ^
      (((crypto.getRandomValues(new Uint8Array(1)) as any) as number[])[0] &
        (15 >> (c / 4)))
    ).toString(16);
  });
}
