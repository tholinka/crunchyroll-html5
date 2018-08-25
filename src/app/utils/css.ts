export function importCSSByUrl(url: string) {
  const el = document.createElement('link');
  el.setAttribute('rel', 'stylesheet');
  el.setAttribute('href', url);

  document.head.appendChild(el);
}

export function importCSS(content: string) {
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(content));

  document.head.appendChild(style);
}
