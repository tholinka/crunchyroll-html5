import { IMedia } from 'crunchyroll-lib/models/IMedia';
import { IMediaMetadata } from 'crunchyroll-lib/models/IMediaMetadata';
import { IStream } from 'crunchyroll-lib/models/IStream';
import { Player } from '../media/player/Player';
import { IMediaService } from '../models/IMediaService';
import { IMediaSubtitle } from '../models/IMediaSubtitle';
import { ITrackMedia } from '../player/crunchyroll';
import { LegacyOffSubtitle } from './LegacyOffSubtitle';
import { LegacySubtitle } from './LegacySubtitle';

export class LegacyPlayerService implements IMediaService {
  private _player: Player;
  private _media: IMedia;
  private _stream: IStream;
  private _metadata: IMediaMetadata;

  constructor(player: Player, media: IMedia) {
    this._player = player;
    this._media = media;

    this._stream = media.getStream();
    this._metadata = media.getMetadata();
  }

  public getTitle(): string {
    return (
      this._metadata.getSeriesTitle() +
      ' Episode ' +
      this._metadata.getEpisodeNumber() +
      ' – ' +
      this._metadata.getEpisodeTitle()
    );
  }

  public getDuration(): number {
    return this._stream.getDuration();
  }

  public getDefaultFile(): string | undefined {
    return this._stream.getFile();
  }

  public getTracking(): ITrackMedia {
    const stream = this._stream;

    return {
      id: this._media.getId(),
      type: stream.getType(),
      encodeId: stream.getEncodeId(),
      pingIntervals: this._media.getPingIntervals()
    };
  }

  public getSubtitles(): IMediaSubtitle[] {
    const defaultFile = this.getDefaultFile();
    const subtitles: IMediaSubtitle[] = this._media
      .getSubtitles()
      .map(x => new LegacySubtitle(defaultFile, x));

    const hasDefault = subtitles.filter(x => x.isDefault()).length > 0;

    subtitles.unshift(new LegacyOffSubtitle(defaultFile, !hasDefault));

    return subtitles;
  }

  public getStartTime(): number {
    return this._media.getStartTime();
  }

  public isAutoPlay(): boolean {
    return this._media.isAutoPlay();
  }

  public getThumbnailUrl(): string {
    return this._metadata.getEpisodeImageUrl();
  }

  public getNextMediaUrl(): string | undefined {
    return this._media.getNextVideoUrl();
  }
}
