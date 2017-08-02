import { Video, Stream, Subtitle } from './media/video';
import { NextVideo } from './media/nextvideo';
import { Player } from './media/player';
import * as request from 'request-promise-native';
import { importCSS, importCSSByUrl } from './utils/css';

const css = require('raw-loader!./styles.css');

class Bootstrap {
  private wrapper: Element;
  private player: Player = new Player();

  constructor() {
    this.wrapper = document.querySelector("#showmedia_video_box");
    if (!this.wrapper) {
      this.wrapper = document.querySelector("#showmedia_video_box_wide");
      this.player.setWide(true);
    }
    this.wrapper.textContent = "Loading HTML5 player...";

    importCSSByUrl("https://fonts.googleapis.com/css?family=Noto+Sans");
    importCSS(css);

    const showmedia = document.querySelector("#showmedia");
    const showmediaVideo = document.querySelector("#showmedia_video");
    const mainMedia = document.querySelector("#main_content");
    this.player.listen('widechange', (wide: boolean) => {
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
    });
  }

  async run() {
    this.wrapper.innerHTML = "";
    this.player.attach(this.wrapper);

    var video = await Video.fromDocument(location.href, document, true);

    if (video.streams.length > 0) {
      let stream = video.streams[0];

      if (stream.nextUrl) {
        this.player.setNextVideo(NextVideo.fromUrlUsingDocument(stream.nextUrl));
      }

      this.player.setStream(stream);
    } else {
      //let stream = await Stream.fromUrl(location.href, video.videoId, "trailer", '0', '');
    }
  }
}

if (Video.validateUrl(location.href)) {
  (new Bootstrap()).run();
}