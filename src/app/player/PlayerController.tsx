import { h, render } from 'preact';
import { Player, IPlayerConfig } from '../media/player/Player';
import { getMediaByUrl, Formats, getMedia } from 'crunchyroll-lib/media';
import { NextVideo } from '../media/nextvideo';
import { NextVideoEvent, PlaybackState, VolumeChangeEvent, PlaybackStateChangeEvent, IVideoDetail } from '../media/player/IPlayerApi';
import parse = require('url-parse');
import { IMedia } from 'crunchyroll-lib/models/IMedia';
import { VideoTracker } from './Tracking';
import { getCollectionCarouselDetail, getMediaMetadataFromDOM } from '../media/CollectionCarouselParser';
import { getCollectionCarouselPage, ICollectionCarouselPage } from './crunchyroll';
import container from "../../config/inversify.config";
import { IStorageSymbol, IStorage } from '../storage/IStorage';

export interface IPlayerControllerOptions {
  quality?: keyof Formats;
  mediaFormat?: string;
  mediaQuality?: string;

  startTime?: number;
  sizeEnabled?: boolean;
  autoPlay?: boolean;
  affiliateId?: string;
}

declare interface IVolumeData {
  volume: number;
  muted: boolean;
}

export class PlayerController {
  private _element: Element;
  private _url: string;
  private _mediaId: number;

  private _sizeEnabled: boolean = true;

  private _startTime?: number;
  private _autoPlay?: boolean;
  private _affiliateId?: string;
  private _quality: keyof Formats;
  private _mediaFormat?: string;
  private _mediaQuality?: string;

  private _player?: Player;
  private _changedMedia: boolean = false;

  private _tracking?: VideoTracker;

  private _cachedCarouselPage?: ICollectionCarouselPage;

  constructor(element: Element, url: string, mediaId: number, options?: IPlayerControllerOptions) {
    this._element = element;
    this._url = url;
    this._mediaId = mediaId;

    if (options) {
      this._startTime = options.startTime;
      this._sizeEnabled = !!options.sizeEnabled;
      this._autoPlay = options.autoPlay;
      this._affiliateId = options.affiliateId;
      this._quality = options.quality ? options.quality : "360p";

      this._mediaFormat = options.mediaFormat;
      this._mediaQuality = options.mediaQuality;
    }
  }

  private _getThumbnailByMediaId(mediaId: number): string|undefined {
    const img = document.querySelector("a.link.block-link.block[href$=\"-" + mediaId + "\"] img.mug");
    if (!img) return undefined;

    const url = img.getAttribute("src");
    if (!url) return undefined;

    return url.replace(/_[a-zA-Z]+(\.[a-zA-Z]+)$/, "_full$1");
  }

  private _getDefaultConfig(): IPlayerConfig {
    const thumbnailUrl = this._getThumbnailByMediaId(this._mediaId);
    if (!thumbnailUrl) return {};

    return {
      thumbnailUrl: thumbnailUrl
    };
  }

  private async _onVolumeChange(e: VolumeChangeEvent): Promise<void> {
    const volume = e.volume;
    const muted = e.muted;

    const storage = container.get<IStorage>(IStorageSymbol);

    const data = {
      volume: volume,
      muted: muted
    } as IVolumeData;

    await storage.set<IVolumeData>('volume', data);
  }

  private _onFullscreenChange(): void {
    if (!this._player || this._player.getApi().isFullscreen()) return;

    // Don't do anything if the media hasn't changed
    if (!this._changedMedia) return;

    const api = this._player.getApi();

    // Redirect the page to the current media
    const url = parse(this._url, true);
    if (!url.query) {
      url.query = {};
    }
    url.query['t'] = Math.floor(api.getCurrentTime()).toString();

    location.href = url.toString();
  }

  private async _loadMedia(media: IMedia): Promise<void> {
    if (!this._player) return;
    if (this._tracking) {
      this._tracking.dispose();
      this._tracking = undefined;
    }

    const metadata = media.getMetadata();
    const stream = media.getStream();
    
    // Construct a title
    const title = metadata.getSeriesTitle() + " Episode " + metadata.getEpisodeNumber() + " – " + metadata.getEpisodeTitle();

    const videoConfig = {
      title: title,
      url: stream.getFile(),
      duration: stream.getDuration(),
      subtitles: media.getSubtitles(),
      startTime: this._startTime === undefined ? media.getStartTime() || 0 : this._startTime,
      autoplay: this._autoPlay === undefined ? media.isAutoPlay() : this._autoPlay,
      thumbnailUrl: metadata.getEpisodeImageUrl()
    } as IPlayerConfig;

    const storage = container.get<IStorage>(IStorageSymbol);

    const volumeData = await storage.get<IVolumeData>('volume');
    if (volumeData) {
      videoConfig.muted = volumeData.muted;
      videoConfig.volume = volumeData.volume;
    }

    // Register the next video if there's one
    const nextVideoUrl = media.getNextVideoUrl();
    if (nextVideoUrl) {
      let nextVideo = NextVideo.fromUrlUsingDocument(nextVideoUrl);
      if (!nextVideo) {
        try {
          const detail = getCollectionCarouselDetail(nextVideoUrl);
          const mediaMetadata = getMediaMetadataFromDOM();
          if (mediaMetadata) {
            if (!this._cachedCarouselPage || !this._cachedCarouselPage.data || !this._cachedCarouselPage.data[detail.mediaId]) {
              this._cachedCarouselPage = await getCollectionCarouselPage(detail.mediaId, detail.groupId, mediaMetadata.collection_id, detail.index);
            }
            if (this._cachedCarouselPage.data && this._cachedCarouselPage.data[detail.mediaId]) {
              const doc = (new DOMParser()).parseFromString("<html><head></head><body>" + this._cachedCarouselPage.data[detail.mediaId] + "</body></html>", "text/html");
              nextVideo = NextVideo.fromElement(doc.body);
            }
          }
        } catch (e) {
          // It failed to get the carousel details for the next video.
        }
      }
      if (nextVideo) {
        videoConfig.nextVideo = {
          title: nextVideo.episodeNumber + ': ' + nextVideo.episodeTitle,
          duration: typeof nextVideo.duration === 'number' ? nextVideo.duration : NaN,
          url: nextVideo.url,
          thumbnailUrl: nextVideo.thumbnailUrl
        };
      }
    }

    this._tracking = new VideoTracker(media, this._player.getApi());

    if (videoConfig.autoplay) {
      this._player.loadVideoByConfig(videoConfig);
    } else {
      this._player.cueVideoByConfig(videoConfig);
    }
  }

  private async _onNextVideo(e: NextVideoEvent): Promise<void> {
    if (!this._player) return;

    if (!this._player.getApi().isFullscreen()) {
      window.location.href = e.detail.url;
      return;
    }

    await this._playNextVideo(e.detail);
  }

  private async _playNextVideo(detail: IVideoDetail): Promise<void> {
    if (!this._player) return;

    this._url = detail.url;
    this._changedMedia = true;
    this._autoPlay = true;
    this._startTime = undefined;

    if (this._tracking) {
      this._tracking.dispose();
      this._tracking = undefined;
    }

    this._player.loadVideoByConfig({
      thumbnailUrl: detail.thumbnailUrl
    });

    let media: IMedia;
    if (this._mediaFormat && this._mediaQuality) {
      media = await getMediaByUrl(detail.url, this._mediaFormat, this._mediaQuality, {
        affiliateId: this._affiliateId,
        autoPlay: true
      });
    } else {
      media = await getMediaByUrl(detail.url, this._quality, {
        affiliateId: this._affiliateId,
        autoPlay: true
      });
    }

    await this._loadMedia(media);
  }

  /**
   * Initial loading of player and the media to play.
   * @param player the player reference
   */
  private async _onPlayerReady(player: Player): Promise<void> {
    this._player = player;
    const api = player.getApi();
    api.listen('fullscreenchange', () => this._onFullscreenChange());
    api.listen('nextvideo', (e: NextVideoEvent) => this._onNextVideo(e));
    api.listen('volumechange', (e: VolumeChangeEvent) => this._onVolumeChange(e));
    api.listen('playbackstatechange', (e: PlaybackStateChangeEvent) => this._onPlaybackStateChange(e));

    let media: IMedia;

    if (this._mediaFormat && this._mediaQuality) {
      media = await getMedia(this._mediaId.toString(), this._mediaFormat, this._mediaQuality, this._url, {
        affiliateId: this._affiliateId,
        autoPlay: this._autoPlay
      });
    } else {
      media = await getMedia(this._mediaId.toString(), this._quality, this._url, {
        affiliateId: this._affiliateId,
        autoPlay: this._autoPlay
      });
    }

    await this._loadMedia(media);
  }

  private async _onPlaybackStateChange(e: PlaybackStateChangeEvent): Promise<void> {
    if (e.state !== PlaybackState.ENDED || !this._player) return;

    const detail = this._player.getApi().getNextVideoDetail();
    if (!detail) return;

    if (!this._player.getApi().isFullscreen()) {
      window.location.href = detail.url;
      return;
    }

    await this._playNextVideo(detail);
  }

  private _onSizeChange(large: boolean): void {
    if (!this._player) return;
    const showmedia = document.querySelector("#showmedia");
    const showmediaVideo = document.querySelector("#showmedia_video");
    const mainMedia = document.querySelector("#main_content");
    if (!showmedia || !showmediaVideo || !mainMedia) return;

    const api = this._player.getApi();
    var playing = api.getPreferredPlaybackState() === PlaybackState.PLAYING;
    if (large) {
      this._element.setAttribute("id", "showmedia_video_box_wide");
      this._element.classList.remove("xsmall-margin-bottom");
      mainMedia.classList.remove("new_layout");
      showmedia.parentElement!.classList.add("new_layout");
      showmedia.parentElement!.classList.add("new_layout_wide")
      showmedia.parentNode!.insertBefore(showmediaVideo, showmedia);
    } else {
      this._element.setAttribute("id", "showmedia_video_box");
      this._element.classList.add("xsmall-margin-bottom");
      showmedia.parentElement!.classList.remove("new_layout");
      showmedia.parentElement!.classList.remove("new_layout_wide")
      mainMedia.classList.add("new_layout");
      if (mainMedia.childNodes.length === 0) {
        mainMedia.appendChild(showmediaVideo);
      } else {
        mainMedia.insertBefore(showmediaVideo, mainMedia.childNodes[0]);
      }
    }
    if (playing) {
      api.playVideo(true);
    }
  }

  get large(): boolean {
    return this._element.id === "showmedia_video_box_wide";
  }
  
  /**
   * Returns whether sizing is enabled.
   */
  isSizeEnabled(): boolean {
    return this._sizeEnabled;
  }

  render(): void {
    const onSizeChange = (large: boolean) => this._onSizeChange(large);
    const onPlayerReady = (player: Player) => this._onPlayerReady(player);

    render((
      <Player
        ref={onPlayerReady}
        onSizeChange={onSizeChange}
        large={this.large}
        sizeEnabled={this.isSizeEnabled()}
        config={this._getDefaultConfig()}></Player>
    ), this._element);
  }
}