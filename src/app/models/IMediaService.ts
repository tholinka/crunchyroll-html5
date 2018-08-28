import { ITrackMedia } from '../player/crunchyroll';
import { IMediaSubtitle } from './IMediaSubtitle';

export interface IMediaService {
  getTitle(): string;
  getDuration(): number;
  getFile(): string | undefined;
  getTracking(): ITrackMedia;
  getSubtitles(): IMediaSubtitle[];
  getStartTime(): number;
  isAutoPlay(): boolean;
  getThumbnailUrl(): string;
  getNextMediaUrl(): string | undefined;
}
