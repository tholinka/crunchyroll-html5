import { Stream } from './video';
import * as request from 'request-promise-native';

export async function trackProgress(stream: Stream, currentTime: number, elapsedTime: number, callCount: number) {
  var response = await request.post('http://www.crunchyroll.com/ajax/', {
    form: {
      cbcallcount: callCount,
      h: '',
      cbelapsed: elapsedTime,
      video_encode_id: stream.encodeId,
      req: 'RpcApiVideo_VideoView',
      media_type: stream.mediaType,
      ht: '0',
      playhead: currentTime,
      media_id: stream.mediaId
    }
  });
}