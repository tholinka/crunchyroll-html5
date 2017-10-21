import { Stream } from './video';
import * as request from '../utils/xhr';

export async function trackProgress(stream: Stream, currentTime: number, elapsedTime: number, callCount: number) {
  const response = await request.post('http://www.crunchyroll.com/ajax/', {
    cbcallcount: callCount,
    h: '',
    cbelapsed: elapsedTime,
    video_encode_id: stream.encodeId,
    req: 'RpcApiVideo_VideoView',
    media_type: stream.mediaType,
    ht: '0',
    playhead: currentTime,
    media_id: stream.mediaId
  });
}