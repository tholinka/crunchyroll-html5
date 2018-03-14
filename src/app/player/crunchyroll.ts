import { IMedia } from 'crunchyroll-lib/models/IMedia';
import container from 'crunchyroll-lib/config';
import { IHttpClient } from 'crunchyroll-lib/models/http/IHttpClient';

export async function trackProgress(media: IMedia, currentTime: number, elapsedTime: number, callCount: number) {
  const httpClient = container.get<IHttpClient>("IHttpClient");

  const stream = media.getStream();

  const response = await httpClient.post('http://www.crunchyroll.com/ajax/', {
    cbcallcount: callCount,
    h: '',
    cbelapsed: elapsedTime,
    video_encode_id: stream.getEncodeId(),
    req: 'RpcApiVideo_VideoView',
    media_type: stream.getType(),
    ht: '0',
    playhead: currentTime,
    media_id: media.getId()
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}