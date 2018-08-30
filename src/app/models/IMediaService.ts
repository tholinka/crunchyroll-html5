import { ITrackMedia } from '../player/crunchyroll';
import { IMediaSubtitle } from './IMediaSubtitle';

export interface IMediaService {
  getTitle(): string;
  getDuration(): number;
  getDefaultFile(): string | undefined;
  getTracking(): ITrackMedia;
  getSubtitles(): IMediaSubtitle[];
  getStartTime(): number;
  isAutoPlay(): boolean;
  getThumbnailUrl(): string;
  getNextMediaUrl(): string | undefined;
}
