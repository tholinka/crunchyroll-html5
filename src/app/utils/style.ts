const prefixes = [
  '-webkit-',
  '-moz-',
  '-ms-',
  '-o-'
];

export function vendorPrefix(key: string, value: string) {
  const css: string[] = [
    key + ": " + value
  ];
  for (const prefix of prefixes) {
    css.push(prefix + key + ": " + value);
  }

  return css.join(";") + ";";
}