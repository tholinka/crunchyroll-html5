import container from 'crunchyroll-lib/config';
import { IHttpClient } from 'crunchyroll-lib/models/http/IHttpClient';
import { buildQuery } from '../utils/url';

interface IVideoViewBody {
  req: string;
  video_encode_id: string;
  media_id: string;
  media_type: number;
  cbcallcount: number;
  cbelapsed: number;
  playhead: number;
  h: string;
  ht: string;
  affiliate_code?: string;
}

export interface ITrackMedia {
  encodeId: string;
  type: number;
  id: string;
  pingIntervals: number[];
}

export async function trackProgress(
  media: ITrackMedia,
  currentTime: number,
  elapsedTime: number,
  callCount: number,
  affiliateCode?: string
) {
  const httpClient = container.get<IHttpClient>('IHttpClient');

  const body: IVideoViewBody = {
    cbcallcount: callCount,
    h: '',
    cbelapsed: elapsedTime,
    video_encode_id: media.encodeId,
    req: 'RpcApiVideo_VideoView',
    media_type: media.type,
    ht: '0',
    playhead: currentTime,
    media_id: media.id
  };
  if (affiliateCode) {
    body.affiliate_code = affiliateCode;
  }
  await httpClient.post('https://www.crunchyroll.com/ajax/', body as any, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

export interface ICollectionCarouselPage {
  data: { [key: string]: string } | null;
  exception_class: string | null;
  exception_error_code: string | null;
  message_list: string[];
  result_code: number;
  suggested_redirect_url: string | null;
}

export async function getCollectionCarouselPage(
  mediaId: string,
  groupId: number | undefined,
  collectionId: number,
  index: number
): Promise<ICollectionCarouselPage> {
  const httpClient = container.get<IHttpClient>('IHttpClient');

  const query: { [key: string]: string } = {
    req: 'RpcApiMedia_GetCollectionCarouselPage',
    media_id: mediaId.toString(),
    collection_id: collectionId.toString(),
    group_id: groupId === undefined ? '' : groupId.toString(),
    first_index: index.toString()
  };

  const response = await httpClient.get(
    'https://www.crunchyroll.com/ajax/?' + buildQuery(query)
  );

  return parseRpc(response.body);
}

export function parseRpc(json: string): any {
  const startTag = '/*-secure-';
  const endTag = '*/';

  try {
    return JSON.parse(json);
  } catch (e) {
    return JSON.parse(
      json.substring(startTag.length, json.length - endTag.length)
    );
  }
}
