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

    quality = token.match(/^showmedia\.(\d{2,3}0p)$/)![1]; // regex match, first capture (2-3 digits followed by 0p)
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
  let cselEl = document.querySelector("a.selected[token^=showmedia\\.]")!;
  let targetEl = document.querySelector("a[token^=showmedia\\." + quality + "]")!;
  
  if (cselEl != targetEl) {
    cselEl.classList.replace('dark-button','default-button');
    cselEl.classList.remove('selected');
    targetEl.classList.replace('default-button','dark-button');
    targetEl.classList.add('selected');
  }
  
  storedQuality = quality;
}

export function getSelectedQuality(): string|undefined {
  if (storedQuality === "") 
    throw "Quality must be updated first!";
  
  return storedQuality;
}