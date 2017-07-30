import { Video, Stream, Subtitle } from './media/video';
import { Player } from './media/player';
import * as request from 'request-promise-native';

const libjassCss = require('raw-loader!libjass/libjass.css');
const css = require('raw-loader!./styles.css');

var wrapper = document.querySelector("#showmedia_video_player");
wrapper.textContent = "Loading HTML5 player...";

var style = document.createElement("style");
style.appendChild(document.createTextNode(libjassCss + "\n" + css));

document.body.appendChild(style);

if (Video.validateUrl(location.href)) {
  Video.fromDocument(location.href, document, true)
  .then(video => {
    var player = new Player();
    player.setStream(video.streams[0]);
    wrapper.innerHTML = "";
    player.attach(wrapper);
  });
}