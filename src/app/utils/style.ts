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
  for (let i = 0; i < prefixes.length; i++) {
    css.push(prefixes[i] + key + ": " + value);
  }

  return css.join(";") + ";";
}