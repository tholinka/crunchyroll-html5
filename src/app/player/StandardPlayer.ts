import * as parseUrl from 'url-parse';
import { IStorageSymbol, IStorage } from '../storage/IStorage';
import container from "../../config/inversify.config";
import "../libs/polyfill/DOMTokenList";

export function getMediaId(url: string): number|undefined {
  // https://www.crunchyroll.com/boruto-naruto-next-generations/episode-17-run-sarada-740239
  const re = /https?:\/\/(?:(www|m)\.)?(crunchyroll\.(?:com|fr)\/(?:media(?:-|\/\?id=)|[^/]*\/[^/?&]*?)([0-9]+))(?:[/?&]|$)/g;
  const m = re.exec(url);
  if (!m) return undefined;

  return parseInt(m[3], 10);
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

let storedQuality: string|undefined = ""; // empty string means this hasn't run yet
export async function updateQualitySettings(): Promise<void> {
  let quality: string|undefined; 
  
  const fmtElements = document.querySelectorAll("a[token^=showmedia\\.]");
  for (let i = 0; i < fmtElements.length; i++) {
    const href = fmtElements[i].getAttribute("href");
    if (!href || href.indexOf("/freetrial") === 0 || !fmtElements[i].classList.contains('selected'))
      continue;
    const token = fmtElements[i].getAttribute("token");
    if (!token) continue;

    quality = parseToken(token);
  }
  
  // get the quality from the URL
  let qualityOverride: string|undefined = undefined;
  let curl = parseUrl(window.location.href, true);
  for (let key in curl.query) {
    let m = key.match(/p(\d{2,3}0)/);
    if (m !== null && curl.query[key] === "1") {
      qualityOverride = m[1] + "p";
    }
  }
  
  const storage = container.get<IStorage>(IStorageSymbol);
  // get and check saved quality
  let savedQuality: string|undefined = await storage.get<string>("resolution");
  if (savedQuality === undefined || (qualityOverride !== undefined && qualityOverride !== savedQuality)) {
    storage.set<string>("resolution", qualityOverride !== undefined ? qualityOverride : quality);
    savedQuality = qualityOverride;
  }
  qualityOverride = savedQuality;
  
  // always go with the override if defined
  if (qualityOverride !== undefined)
    quality = qualityOverride;
  
  // update quality selector buttons
  let selectedQualityElement = document.querySelector("a.selected[token^=showmedia\\.]");
  let targetQualityElement = document.querySelector("a[token^=showmedia\\." + quality + "]");

  if (selectedQualityElement && targetQualityElement) {
    if (selectedQualityElement !== targetQualityElement) {
      selectedQualityElement.classList.replace('dark-button','default-button');
      selectedQualityElement.classList.remove('selected');

      targetQualityElement.classList.replace('default-button','dark-button');
      targetQualityElement.classList.add('selected');
    }
    
    storedQuality = quality;
  } else if (selectedQualityElement) {
    var token = selectedQualityElement.getAttribute("token");

    if (token) {
      storedQuality = parseToken(token);
    } else {
      storedQuality = "360p";
    }
  } else {
    storedQuality = "360p";
  }
}

export function getSelectedQuality(): string|undefined {
  if (storedQuality === "") 
    throw new Error("Quality must be updated first!");
  
  return storedQuality;
}

function parseToken(token: string) {
  // regex match, first capture (2-3 digits followed by 0p)
  const m = token.match(/^showmedia\.(\d{2,3}0p)$/);
  if (!m) throw new Error("Unable to parse token.");

  return m[1];
}