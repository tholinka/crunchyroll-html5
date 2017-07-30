import { Video, Stream, Subtitle } from './video';
import * as Hls from 'hls.js';
import * as libjass from 'libjass';

export async function init(video: Video) {
  var wrapper = document.querySelector("#showmedia_video_player");

  var videoElement = document.createElement("video");

  var stream: Stream = null;
  var selectedStream = document.querySelector("a.dark-button[token^=showmedia\\.]");
  for (let i = 0; i < video.streams.length; i++) {
    stream = video.streams[i];
    if (video.streams[i].fmt === selectedStream.getAttribute("token").substring(10))
      break;
  }

  var subtitle: Subtitle = null;
  for (let i = 0; i < stream.subtitles.length; i++) {
    subtitle = stream.subtitles[i];
    if (subtitle.isDefault())
      break;

    /*let track = document.createElement("track");
    track.setAttribute("label", stream.subtitles[i].title);
    track.setAttribute("srclang", stream.subtitles[i].langCode);
    track.setAttribute("kind", "subtitles");
    if (stream.subtitles[i].def) {
      track.setAttribute("default", "true");
    }
    let blob: Blob = new Blob([stream.subtitles[i].toVtt()], { type: 'text/vtt' });
    let url: string = URL.createObjectURL(blob);
    track.setAttribute("src", url);
    track.addEventListener("error", e => {
      console.error("Failed to load track");
    });

    videoElement.appendChild(track);*/
  }

  var fixMe = 0;

  var assString = subtitle.toAss();

  var ass = await libjass.ASS.fromString(assString);

  var subsWrapper = document.createElement("div");
  subsWrapper.className = "html5-player__subtitles";
  
  const renderer = new libjass.renderers.WebRenderer(ass, new libjass.renderers.VideoClock(videoElement), subsWrapper, {
    enableSvg: true
  });

  renderer.addEventListener("ready", (e) => {
    fixMe++;
    if (fixMe === 2) {
      videoElement.play();
    }
  });

  /*var source = document.createElement("source");
  source.setAttribute("src", stream.url);
  source.setAttribute("type", "application/x-mpegURL");
  videoElement.appendChild(source);*/

  videoElement.appendChild(document.createTextNode("Your browser does not support HTML5 video."));

  var playerElement = document.createElement("div");
  playerElement.className = "html5-player__video";

  playerElement.appendChild(videoElement);
  playerElement.appendChild(subsWrapper);

  wrapper.innerHTML = "";
  wrapper.appendChild(playerElement);

  var hls = new Hls();
  hls.loadSource(stream.url);
  hls.attachMedia(videoElement);
  hls.on(Hls.Events.MANIFEST_PARSED,function() {
    fixMe++;
    if (fixMe === 2) {
      renderer.resize(videoElement.offsetWidth, videoElement.offsetHeight);
      videoElement.play();
    }
  });
}