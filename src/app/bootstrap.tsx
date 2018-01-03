import { Stream, Subtitle, IMediaDocument, MediaDocument, AffiliateMediaDocument } from './media/video';
import { NextVideo } from './media/nextvideo';
import { Player, IPlayerConfig } from './media/player/Player';
import { importCSS, importCSSByUrl } from './utils/css';
import { h, render } from 'preact';
import { PlaybackState, NextVideoEvent, IVideoDetail as INextVideoDetail } from './media/player/IPlayerApi';
import { VideoTracker } from './Tracking';
import parse = require('url-parse');

const css = require('../styles/bootstrap.scss');

export function run() {
  if (
    !!MediaDocument.parseUrlFragments(location.href) ||
    !!AffiliateMediaDocument.parseUrlFragments(location.href)
  ) {
    (new Bootstrap()).run();
  }
}

interface IVideoDetail {
  url: string;
  thumbnailUrl: string;
  mediaDocument: IMediaDocument;
}

class Bootstrap {
  private _wrapper: Element;
  private _player: Player;
  private _tracking: VideoTracker|undefined = undefined;

  private _currentVideoDetail: IVideoDetail|undefined = undefined;

  constructor() {
    let wrapper = document.querySelector("#showmedia_video_box");
    if (!wrapper) {
      wrapper = document.querySelector("#showmedia_video_box_wide");
    }
    if (!wrapper) {
      wrapper = document.querySelector("#content");
    }
    if (!wrapper) throw new Error("Not able to find video wrapper.");
    this._wrapper = wrapper;
    this._wrapper.textContent = "Loading HTML5 player...";

    importCSSByUrl("https://fonts.googleapis.com/css?family=Noto+Sans");
    importCSS(css);
  }

  private async _getMediaDocument(): Promise<IMediaDocument|undefined> {
    if (!!MediaDocument.parseUrlFragments(location.href)) {
      return new MediaDocument(location.href, document);
    }
    
    if (!!AffiliateMediaDocument.parseUrlFragments(location.href)) {
      return new AffiliateMediaDocument(location.href);
    }
    return undefined;
  }

  private _getMediaId(): string|undefined {
    const fragments = MediaDocument.parseUrlFragments(location.href);
    if (fragments) {
      return fragments.mediaId;
    }
    
    const fragments2 = AffiliateMediaDocument.parseUrlFragments(location.href);
    if (fragments2) {
      return fragments2.mediaId;
    }

    return undefined;
  }

  private _onSizeChange(large: boolean) {
    const showmedia = document.querySelector("#showmedia");
    const showmediaVideo = document.querySelector("#showmedia_video");
    const mainMedia = document.querySelector("#main_content");
    if (!showmedia || !showmediaVideo || !mainMedia) return;

    const api = this._player.getApi();
    var playing = api.getPreferredPlaybackState() === PlaybackState.PLAYING;
    if (large) {
      this._wrapper.setAttribute("id", "showmedia_video_box_wide");
      this._wrapper.classList.remove("xsmall-margin-bottom");
      mainMedia.classList.remove("new_layout");
      showmedia.parentElement!.classList.add("new_layout");
      showmedia.parentElement!.classList.add("new_layout_wide")
      showmedia.parentNode!.insertBefore(showmediaVideo, showmedia);
    } else {
      this._wrapper.setAttribute("id", "showmedia_video_box");
      this._wrapper.classList.add("xsmall-margin-bottom");
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

  static getVideoThumbnailUrl(id: string): string|undefined {
    const img = document.querySelector("a.link.block-link.block[href$=\"-" + id + "\"] img.mug");
    if (!img) return undefined;

    const url = img.getAttribute("src");
    if (!url) return undefined;

    return url.replace(/_[a-zA-Z]+(\.[a-zA-Z]+)$/, "_full$1");
  }

  async loadNextVideo(detail: INextVideoDetail) {
    await this.loadVideo({
      thumbnailUrl: detail.thumbnailUrl,
      url: detail.url,
      mediaDocument: await MediaDocument.fromUrl(detail.url)
    }, true);
  }

  async loadVideo(detail: IVideoDetail, remote: boolean = false) {
    if (this._tracking) {
      this._tracking.dispose();
      this._tracking = undefined;
    }
    const player = this._player;

    if (remote) {
      this._currentVideoDetail = detail;
    } else {
      this._currentVideoDetail = undefined;
    }

    player.loadVideoByConfig({
      thumbnailUrl: detail.thumbnailUrl.replace(/_[a-zA-Z]+(\.[a-zA-Z]+)$/, "_full$1")
    });

    let doc: IMediaDocument = detail.mediaDocument;

    const mediaFormat = doc.getDefaultMediaFormat();
    if (!mediaFormat) throw new Error("No stream found.");

    const stream = await mediaFormat.getStream();
    let startTime = doc.getStartTime();
    if (startTime === -1) {
      startTime = stream.startTime;
    }
    
    this._tracking = new VideoTracker(stream, player.getApi());

    const videoConfig: IPlayerConfig = {
      title: doc.getTitle(),
      url: stream.url,
      duration: stream.duration,
      subtitles: stream.subtitles,
      startTime: startTime,
      autoplay: doc.isAutoPlay(),
      thumbnailUrl: stream.thumbnailUrl
    };
    
    if (doc instanceof MediaDocument) {
      const nextVideo = NextVideo.fromUrlUsingDocument(stream.nextUrl);
      if (nextVideo) {
        videoConfig.nextVideo = {
          title: nextVideo.episodeNumber + ': ' + nextVideo.episodeTitle,
          duration: typeof nextVideo.duration === 'number' ? nextVideo.duration : NaN,
          url: nextVideo.url,
          thumbnailUrl: nextVideo.thumbnailUrl
        };
      }
    }

    if (doc.isAutoPlay()) {
      player.loadVideoByConfig(videoConfig);
    } else {
      player.cueVideoByConfig(videoConfig);
    }
  }

  async run() {
    this._wrapper.innerHTML = "";

    const preloadConfig: IPlayerConfig = {};

    const mediaId = this._getMediaId();

    if (mediaId) {
      const thumbnailUrl = Bootstrap.getVideoThumbnailUrl(mediaId);
      if (thumbnailUrl) {
        preloadConfig.thumbnailUrl = thumbnailUrl;
      }
    }

    const loadVideo = async (player: Player) => {
      this._player = player;

      const api = player.getApi();
      api.listen('fullscreenchange', () => {
        if (api.isFullscreen()) return;
        if (!this._currentVideoDetail) return;
        if (this._currentVideoDetail.url === location.href) return;

        const url = parse(this._currentVideoDetail.url, true);
        if (!url.query) {
          url.query = {};
        }
        url.query['t'] = Math.floor(api.getCurrentTime()) + '';

        location.href = url.toString();
      });
      api.listen('nextvideo', (e: NextVideoEvent) => {
        if (!api.isFullscreen()) return;
        e.preventDefault();

        this.loadNextVideo(e.detail)
      }, false);

      let thumbnailUrl: string|undefined = undefined;
      if (mediaId) {
        thumbnailUrl = Bootstrap.getVideoThumbnailUrl(mediaId);
      }

      let mediaDocument: IMediaDocument|undefined = await this._getMediaDocument();
      if (mediaDocument) {
        this.loadVideo({
          thumbnailUrl: thumbnailUrl || '',
          url: location.href,
          mediaDocument: mediaDocument
        }, false);
      } else {
        this._wrapper.textContent = "An error occurred!";
      }
    };
    const large = this._wrapper.id === "showmedia_video_box_wide";
    const onSizeChange = (large: boolean) => this._onSizeChange(large);

    const sizeEnabled = !!MediaDocument.parseUrlFragments(location.href);

    render((
      <Player
        ref={loadVideo}
        config={preloadConfig}
        large={large}
        sizeEnabled={sizeEnabled}
        onSizeChange={onSizeChange}></Player>
    ), this._wrapper);
  }
}