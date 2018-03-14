import * as parseUrl from 'url-parse';

export function getMediaId(url: string): string|undefined {
  // https://www.crunchyroll.com/boruto-naruto-next-generations/episode-17-run-sarada-740239
  const re = /https?:\/\/(?:(www|m)\.)?(crunchyroll\.(?:com|fr)\/(?:media(?:-|\/\?id=)|[^/]*\/[^/?&]*?)([0-9]+))(?:[/?&]|$)/g;
  const m = re.exec(url);
  if (!m) return undefined;

  return m[3];
}

interface IQueryStartTime {
  t?: string;
}

export function getStartTime(url: string): number|undefined {
  const query = parseUrl(url, true).query as IQueryStartTime;
  if (typeof query.t === 'string') {
    return parseFloat(query.t);
  } else {
    return undefined;
  }
}

interface IQueryAutoPlay {
  auto_play?: string;
}

export function getAutoPlay(url: string): boolean|undefined {
  const query = parseUrl(url, true).query as IQueryAutoPlay;
  if (typeof query.auto_play === 'string') {
    return query.auto_play === "1";
  } else {
    return undefined;
  }
}

export function getSelectedQuality(): string|undefined {
  const fmtElements = document.querySelectorAll("a[token^=showmedia\\.]");
  for (let i = 0; i < fmtElements.length; i++) {
    const href = fmtElements[i].getAttribute("href");
    if (!href || href.indexOf("/freetrial") === 0 || !fmtElements[i].classList.contains('dark-button'))
      continue;
    const token = fmtElements[i].getAttribute("token");
    if (!token) continue;

    return token.substring(10);
  }
  return undefined;
}