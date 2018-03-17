
import * as parseUrl from 'url-parse';

interface IAffiliateQuery {
  aff?: string;
  media_id?: string;
  video_format?: string;
  video_quality?: string;
  auto_play?: string;
  t?: string;
}

export interface IAffiliateMediaData {
  affiliateId: string;
  mediaId: number;
  videoFormat: string;
  videoQuality: string;
  autoPlay: boolean;
  startTime: number;
}

export function parseUrlFragments(url: string): IAffiliateMediaData|undefined {
  const re = /^https?:\/\/(?:(?:www|m)\.)?(?:crunchyroll\.(?:com|fr))\/affiliate_iframeplayer\?/g;
  const m = re.exec(url);
  if (!m) return undefined;

  const query = parseUrl(url, true).query as IAffiliateQuery;

  if (typeof query.aff !== "string") throw new Error("`aff` not in query");
  if (typeof query.media_id !== "string") throw new Error("`media_id` not in query");
  if (typeof query.video_format !== "string") throw new Error("`video_format` not in query");
  if (typeof query.video_quality !== "string") throw new Error("`video_quality` not in query");

  let startTime = 0;
  if (typeof query.t === "string") {
    startTime = parseFloat(query.t);
    if (!isFinite(startTime)) startTime = 0;
  }

  return {
    affiliateId: query.aff,
    mediaId: parseInt(query.media_id, 10),
    videoFormat: query.video_format,
    videoQuality: query.video_quality,
    autoPlay: query.auto_play === "1",
    startTime: startTime
  };
}