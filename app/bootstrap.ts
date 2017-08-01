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
    this.wrapper = document.querySelector("#showmedia_video_player");
    this.wrapper.textContent = "Loading HTML5 player...";

    importCSSByUrl("https://fonts.googleapis.com/css?family=Noto+Sans");
    importCSS(css);
  }

  async run() {
    this.wrapper.innerHTML = "";
    this.player.attach(this.wrapper);

    var video = await Video.fromDocument(location.href, document, true);
    let stream = video.streams[0];

    if (stream.nextUrl) {
      this.player.setNextVideo(NextVideo.fromUrlUsingDocument(stream.nextUrl));
    }

    this.player.setStream(stream);
  }
}

if (Video.validateUrl(location.href)) {
  (new Bootstrap()).run();
}