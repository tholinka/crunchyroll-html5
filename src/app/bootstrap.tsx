import { Video, Stream, Subtitle } from './media/video';
import { NextVideo } from './media/nextvideo';
import { Player, IPlayerConfig } from './media/player/Player';
import { importCSS, importCSSByUrl } from './utils/css';
import { h, render } from 'preact';
import { PlaybackState, NextVideoEvent } from './media/player/IPlayerApi';
import { VideoTracker } from './Tracking';
import parse = require('url-parse');

const css = require('../styles/bootstrap.scss');

export function run() {
  if (Video.validateUrl(location.href)) {
    (new Bootstrap()).run();
  }
}

interface IVideoDetail {
  url: string;
  thumbnailUrl: string;
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
    if (!wrapper) throw new Error("Not able to find video wrapper.");
    this._wrapper = wrapper;
    this._wrapper.textContent = "Loading HTML5 player...";

    importCSSByUrl("https://fonts.googleapis.com/css?family=Noto+Sans");
    importCSS(css);
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

    let video: Video;

    if (remote) {
      video = await Video.fromUrl(detail.url, true);
    } else {
      video = await Video.fromDocument(detail.url, document, true);
    }
    if (video.streams.length === 0) throw new Error("No stream found.");
    const stream = video.streams[0];
    let startTime = stream.startTime;
    if (!remote) {
      const url = parse(detail.url, true);
      if (url.query && url.query.hasOwnProperty('t')) {
        startTime = parseFloat(url.query['t']!);
      }
    }
    this._tracking = new VideoTracker(stream, player.getApi());

    const videoConfig: IPlayerConfig = {
      title: video.title,
      url: stream.url,
      duration: stream.duration,
      subtitles: stream.subtitles,
      startTime: startTime
    };
    
    const nextVideo = NextVideo.fromUrlUsingDocument(stream.nextUrl);
    if (nextVideo) {
      videoConfig.nextVideo = {
        title: nextVideo.episodeNumber + ': ' + nextVideo.episodeTitle,
        duration: typeof nextVideo.duration === 'number' ? nextVideo.duration : NaN,
        url: nextVideo.url,
        thumbnailUrl: nextVideo.thumbnailUrl
      };
    }

    player.loadVideoByConfig(videoConfig);
  }

  async run() {
    this._wrapper.innerHTML = "";

    const preloadConfig: IPlayerConfig = {};

    const { videoId } = Video.parseUrlFragments(location.href);

    const thumbnailUrl = Bootstrap.getVideoThumbnailUrl(videoId);
    if (thumbnailUrl) {
      preloadConfig.thumbnailUrl = thumbnailUrl;
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

        this.loadVideo(e.detail, true);
      }, false);

      this.loadVideo({
        thumbnailUrl: Bootstrap.getVideoThumbnailUrl(videoId) || '',
        url: location.href
      }, false);
    };
    const large = this._wrapper.id === "showmedia_video_box_wide";
    const onSizeChange = (large: boolean) => this._onSizeChange(large);

    render((
      <Player
        ref={loadVideo}
        config={preloadConfig}
        large={large}
        onSizeChange={onSizeChange}></Player>
    ), this._wrapper);
  }
}