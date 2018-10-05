import { Player } from '../media/player/Player';
import { IMediaService } from '../models/IMediaService';
import { IMediaSubtitle } from '../models/IMediaSubtitle';
import {
  IVilosAnalytics,
  IVilosConfig,
  IVilosMedia,
  IVilosPlayerMetadata
} from '../models/IVilosConfig';
import { ITrackMedia } from '../player/crunchyroll';
import { parseSimpleQuery } from '../utils/url';
import { AssSubtitle } from './AssSubtitle';
import { HardSubtitle } from './HardSubtitle';

const languagePriority = [
  'enUS',
  'enGB',
  'arME',
  'frFR',
  'deDE',
  'itIT',
  'ptBR',
  'ptPT',
  'ruRU',
  'esLA',
  'esES'
];

export class VilosPlayerService implements IMediaService {
  public static fromHTML(body: string, html: string): IVilosConfig | undefined {
    const get = <T>(n: string, regex: RegExp) => {
      const match = n.match(regex);
      if (!match) return undefined;

      return JSON.parse(match[1].replace(/^("|')(.*?)("|')$/g, '"$2"')) as T;
    };

    const media = get<IVilosMedia>(html, /^\W*vilos\.config\.media = (.*?);$/m);
    const analytics = get<IVilosAnalytics>(
      html,
      /^\W*vilos\.config\.analytics = (.*?);$/m
    );

    const playerLanguage = get<string>(
      html,
      /^\W*vilos\.config\.player\.language = (.*?);$/m
    );
    const playerStartOffset = get<string>(
      html,
      /^\W*vilos\.config\.player\.start_offset = (.*?);$/m
    );

    const playerMetadata = get<IVilosPlayerMetadata>(
      body,
      /^\W*var mediaMetadata = (.*?);$/m
    );

    const nextMediaUrl = get<string>(
      html,
      /^\W*var nextMediaUrl = (("|')https?(.*?));$/m
    );

    if (!media || !analytics || !playerLanguage || !playerMetadata)
      return undefined;

    return {
      analytics,
      media,
      player: {
        language: playerLanguage,
        start_offset: playerStartOffset ? parseFloat(playerStartOffset) : 0
      },
      metadata: playerMetadata,
      nextMediaUrl
    } as IVilosConfig;
  }

  private _player: Player;
  private _config: IVilosConfig;

  constructor(player: Player, config: IVilosConfig) {
    this._player = player;
    this._config = config;
  }

  public getTitle(): string {
    return this._config.metadata.name;
  }

  public getDuration(): number {
    return this._config.metadata.duration;
  }

  public getDefaultFile(): string | undefined {
    const streams = this._config.media.streams;

    // Select stream with no hardsubs
    for (const stream of streams) {
      if (!stream.hardsub_lang) return stream.url;
    }

    // Fallback to hardsub
    for (const stream of streams) {
      if (stream.hardsub_lang === this._config.player.language)
        return stream.url;
    }

    // Just select a stream
    for (const stream of streams) {
      return stream.url;
    }

    return undefined;
  }

  public getTracking(): ITrackMedia {
    return {
      id: this._config.analytics.legacy.media_id,
      type: parseInt(this._config.analytics.legacy.media_type, 10),
      encodeId: this._config.analytics.legacy.video_encode_id,
      pingIntervals: [30000, 30000, 60000]
    };
  }

  public getSubtitles(): IMediaSubtitle[] {
    const file = this.getDefaultFile();
    const cSubtitles = this._config.media.subtitles;
    const subtitles: IMediaSubtitle[] = cSubtitles.map(
      x => new AssSubtitle(file, x, x.language === this._config.player.language)
    );

    const unknownSubtitles: HardSubtitle[] = [];

    const subtitleLanguages = cSubtitles.map(x => x.language);

    const streams = this._config.media.streams;
    for (const stream of streams) {
      if (
        stream.hardsub_lang &&
        subtitleLanguages.indexOf(stream.hardsub_lang) === -1
      ) {
        subtitles.push(
          new HardSubtitle(
            stream,
            stream.hardsub_lang === this._config.player.language
          )
        );
      } else if (!stream.hardsub_lang) {
        unknownSubtitles.push(
          new HardSubtitle(
            stream,
            stream.hardsub_lang === this._config.player.language
          )
        );
      }
    }

    const firstUnknown = unknownSubtitles.shift();
    if (unknownSubtitles.length > 0) {
      for (const subtitle of unknownSubtitles) {
        subtitles.unshift(subtitle);
      }
    }
    if (firstUnknown) {
      if (unknownSubtitles.length === 0) {
        firstUnknown.setTitle('Off');
      }
      subtitles.unshift(firstUnknown);
    }

    let hasDefault = subtitles.filter(x => x.isDefault()).length > 0;
    const queries = parseSimpleQuery(location.search);
    if (
      !hasDefault &&
      !queries.hasOwnProperty('ssid') &&
      (unknownSubtitles.length === 0 || !firstUnknown)
    ) {
      for (const language of languagePriority) {
        const items = subtitles.filter(x => x.getLanguage() === language);
        if (items.length > 0) {
          hasDefault = true;
          items[0].setDefault(true);
          break;
        }
      }
    }

    if (!hasDefault && firstUnknown) {
      firstUnknown.setDefault(true);
    }

    return subtitles;
  }

  public getStartTime(): number {
    return this._config.player.start_offset / 1000;
  }

  public isAutoPlay(): boolean {
    return true;
  }

  public getThumbnailUrl(): string {
    return this._config.media.thumbnail.url;
  }

  public getNextMediaUrl(): string | undefined {
    return this._config.nextMediaUrl || undefined;
  }
}
