import { Formats } from 'crunchyroll-lib/media';
import * as parseUrl from 'url-parse';
import container from '../../config/inversify.config';
import '../libs/polyfill/DOMTokenList';
import { IStorage, IStorageSymbol } from '../storage/IStorage';

export function getMediaId(url: string): string | undefined {
  // https://www.crunchyroll.com/boruto-naruto-next-generations/episode-17-run-sarada-740239
  // const re = /https?:\/\/(?:(www|m)\.)?(crunchyroll\.(?:com|fr)\/(?:media(?:-|\/\?id=)|[^/]*\/[^/?&]*?)([0-9]+))(?:[/?&]|$)/g;
  const re = /https?:\/\/www\.crunchyroll\.com\/(([\w-]+)\/)?([^\/]+)\/([\w-]+-([\d]+))/g;
  const m = re.exec(url);
  if (!m) return undefined;

  return m[5];
}

interface IQueryStartTime {
  t?: string;
}

export function getStartTime(url: string): number | undefined {
  const query = parseUrl(url, window.location.href, true)
    .query as IQueryStartTime;
  if (typeof query.t === 'string') {
    return parseFloat(query.t);
  } else {
    return undefined;
  }
}

interface IQueryAutoPlay {
  auto_play?: string;
}

export function getAutoPlay(url: string): boolean | undefined {
  const query = parseUrl(url, window.location.href, true)
    .query as IQueryAutoPlay;
  if (typeof query.auto_play === 'string') {
    return query.auto_play === '1';
  } else {
    return undefined;
  }
}

export function getAvailableQualities(doc?: Document): Array<keyof Formats> {
  if (!doc) doc = document;
  const qualities: Array<keyof Formats> = [];
  const fmtElements = Array.from(
    doc.querySelectorAll('a[token^=showmedia\\.]')
  );
  for (const fmtElement of fmtElements) {
    const href = fmtElement.getAttribute('href');
    if (!href || href.indexOf('/freetrial') === 0) continue;
    const token = fmtElement.getAttribute('token');
    if (!token) continue;

    qualities.push(parseToken(token));
  }

  return qualities;
}

/**
 * Returns the default quality.
 */
function getDefaultQuality(doc?: Document): string | undefined {
  if (!doc) doc = document;
  const elements = Array.from(
    doc.querySelectorAll('a[token^=showmedia\\.].selected')
  );
  for (const el of elements) {
    const href = el.getAttribute('href');
    if (!href || href.indexOf('/freetrial') === 0) continue;
    const token = el.getAttribute('token');
    if (!token) continue;

    return parseToken(token);
  }

  return undefined;
}

/**
 * Returns the quality preferred given in the URL.
 */
function getPreferredQuality(): keyof Formats | undefined {
  const curl = parseUrl(window.location.href, window.location.href, true);
  for (const key in curl.query) {
    if (curl.query.hasOwnProperty(key)) {
      const m = key.match(/p(\d{2,3}0)/);
      if (m !== null && curl.query[key] === '1') {
        return (m[1] + 'p') as keyof Formats;
      }
    }
  }
  return undefined;
}

export function updateSelectedElement(quality: string): void {
  const selectedQualityElement = document.querySelector(
    'a.selected[token^=showmedia\\.]'
  );
  const targetQualityElement = document.querySelector(
    'a[token^=showmedia\\.' + quality + ']'
  );

  if (selectedQualityElement && targetQualityElement) {
    if (selectedQualityElement !== targetQualityElement) {
      selectedQualityElement.classList.replace('dark-button', 'default-button');
      selectedQualityElement.classList.remove('selected');

      targetQualityElement.classList.replace('default-button', 'dark-button');
      targetQualityElement.classList.add('selected');
    }
  }
}

export async function getStoredQuality(): Promise<keyof Formats | undefined> {
  const storage = container.get<IStorage>(IStorageSymbol);

  return await storage.get<keyof Formats>('resolution');
}

export async function setStoredQuality(quality?: keyof Formats): Promise<void> {
  const storage = container.get<IStorage>(IStorageSymbol);

  return await storage.set<keyof Formats>('resolution', quality);
}

export async function getQualitySettings(
  doc?: Document
): Promise<string | undefined> {
  if (!doc) doc = document;
  const availableQualities = getAvailableQualities(doc);

  const defaultQuality = getDefaultQuality(doc);
  let preferredQuality = getPreferredQuality();
  const storedQuality = await getStoredQuality();

  // If the quality in the URL is not available ignore it.
  if (preferredQuality) {
    if (availableQualities.indexOf(preferredQuality) === -1) {
      preferredQuality = undefined;
    } else if (storedQuality !== preferredQuality) {
      // Store the preferred quality
      await setStoredQuality(preferredQuality);
    }
  }

  let quality = defaultQuality;
  if (preferredQuality) {
    quality = preferredQuality;
  } else if (
    storedQuality &&
    availableQualities.indexOf(storedQuality) !== -1
  ) {
    quality = storedQuality;
  }

  if (!quality) {
    quality = preferredQuality || storedQuality;
  }

  return quality;
}

function parseToken(token: string): keyof Formats {
  // regex match, first capture (2-3 digits followed by 0p)
  const m = token.match(/^showmedia\.(\d{2,3}0p)$/);
  if (!m) throw new Error('Unable to parse token.');

  return m[1] as keyof Formats;
}
