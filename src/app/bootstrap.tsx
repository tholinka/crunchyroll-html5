import { Video, Stream, Subtitle } from './media/video';
import { NextVideo } from './media/nextvideo';
import { Player, IPlayerConfig } from './media/player/Player';
import { importCSS, importCSSByUrl } from './utils/css';
import { h, render } from 'preact';
import { PlaybackState } from './media/player/IPlayerApi';
import { VideoTracker } from './Tracking';

const css = require('../styles/bootstrap.scss');

export function run() {
  if (Video.validateUrl(location.href)) {
    (new Bootstrap()).run();
  }
}

class Bootstrap {
  private _wrapper: Element;
  private _player: Player;

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

      player.loadVideoByConfig(preloadConfig);
      var video = await Video.fromDocument(location.href, document, true);
      if (video.streams.length === 0) throw new Error("No stream found.");
      const stream = video.streams[0];
      const tracking = new VideoTracker(stream, player.getApi());

      const videoConfig: IPlayerConfig = {
        title: video.title,
        url: stream.url,
        duration: stream.duration,
        subtitles: stream.subtitles
      };
      /*if (thumbnailUrl) {
        videoConfig.thumbnailUrl = thumbnailUrl;
      }*/
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