export function padLeft(n: any, amount: number, pad: string = '0'): string {
  var str = n + '';
  for (let i = str.length; i < amount; i++) {
    str = pad + str;
  }
  return str;
}

export function padRight(n: any, amount: number, pad: string = '0'): string {
  var str = n + '';
  for (let i = str.length; i < amount; i++) {
    str += pad;
  }
  return str;
}