import { Video, Stream, Subtitle } from './media/video';
import { NextVideo } from './media/nextvideo';
import { Player, IPlayerConfig } from './media/player/Player';
import { importCSS, importCSSByUrl } from './utils/css';
import { h, render } from 'preact';

const css = require('../styles/bootstrap.scss');

class Bootstrap {
  private wrapper: Element;

  constructor() {
    let wrapper = document.querySelector("#showmedia_video_box");
    if (!wrapper) {
      wrapper = document.querySelector("#showmedia_video_box_wide");
    }
    if (!wrapper) throw new Error("Not able to find video wrapper.");
    this.wrapper = wrapper;
    this.wrapper.textContent = "Loading HTML5 player...";

    importCSSByUrl("https://fonts.googleapis.com/css?family=Noto+Sans");
    importCSS(css);

    /*const showmedia = document.querySelector("#showmedia");
    const showmediaVideo = document.querySelector("#showmedia_video");
    const mainMedia = document.querySelector("#main_content");
    this.player.listen('widechange', (wide: boolean) => {
      var playing = this.player.getPlaybackState() === PlaybackState.PLAYING;
      if (wide) {
        this.wrapper.setAttribute("id", "showmedia_video_box_wide");
        this.wrapper.classList.remove("xsmall-margin-bottom");
        mainMedia.classList.remove("new_layout");
        showmedia.parentElement.classList.add("new_layout");
        showmedia.parentElement.classList.add("new_layout_wide")
        showmedia.parentNode.insertBefore(showmediaVideo, showmedia);
      } else {
        this.wrapper.setAttribute("id", "showmedia_video_box");
        this.wrapper.classList.add("xsmall-margin-bottom");
        showmedia.parentElement.classList.remove("new_layout");
        showmedia.parentElement.classList.remove("new_layout_wide")
        mainMedia.classList.add("new_layout");
        if (mainMedia.childNodes.length === 0) {
          mainMedia.appendChild(showmediaVideo);
        } else {
          mainMedia.insertBefore(showmediaVideo, mainMedia.childNodes[0]);
        }
      }
      if (playing) {
        this.player.play();
      }
    });*/
  }

  static getVideoThumbnailUrl(id: string): string|undefined {
    const img = document.querySelector("a.link.block-link.block[href$=\"-" + id + "\"] img.mug");
    if (!img) return undefined;

    const url = img.getAttribute("src");
    if (!url) return undefined;

    return url.replace(/_[a-zA-Z]+(\.[a-zA-Z]+)$/, "_full$1");
  }

  async run() {
    this.wrapper.innerHTML = "";

    const config: IPlayerConfig = {};

    const { videoId } = Video.parseUrlFragments(location.href);

    const thumbnailUrl = Bootstrap.getVideoThumbnailUrl(videoId);
    if (thumbnailUrl) {
      config.thumbnailUrl = thumbnailUrl;
    }

    const loadVideo = async (player: Player) => {
      var video = await Video.fromDocument(location.href, document, true);
      if (video.streams.length === 0) throw new Error("No stream found.");

      player.loadVideoByConfig({
        title: video.title,
        url: video.streams[0].url,
        subtitles: video.streams[0].subtitles
      });
    };
    const large = this.wrapper.id === "showmedia_video_box_wide";

    render((
      <Player config={ config } ref={ loadVideo } large={ large }></Player>
    ), this.wrapper);

    /*if (video.streams.length > 0) {
      let stream = video.streams[0];

      if (stream.nextUrl) {
        this.player.setNextVideo(NextVideo.fromUrlUsingDocument(stream.nextUrl));
      }

      this.player.setStream(stream);
    } else {
      //let stream = await Stream.fromUrl(location.href, video.videoId, "trailer", '0', '');
    }*/
  }
}

if (Video.validateUrl(location.href)) {
  (new Bootstrap()).run();
}