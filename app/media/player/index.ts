import * as Hls from 'hls.js';
import * as libjass from 'libjass';
import { Video, Stream, Subtitle } from '../video';
import { NextVideo } from '../nextvideo';
import { EventTarget } from '../../events/eventtarget';
import { EventHandler } from '../../events/eventhandler';
import { IListener } from '../../events/ilistener';
import { Listener } from '../../events/listener';

import { parseAndFormatTime } from '../../utils/time';

import { BezelElement } from './bezel';
import { ProgressBarElement, IHover } from './progressbar';
import { AnimationButton } from './animation-button';
import { Tooltip, Flags as TooltipFlags } from './tooltip';
import { getOffsetRect, getClientRect, IRect } from '../../utils/offset';

import { SubtitleEngine } from './subtitles/isubtitle';
import { LibAssSubtitle } from './subtitles/libass';

export enum PlaybackState {
  UNSTARTED, PLAYING, PAUSED, BUFFERING, ENDED
}

const ICON_PLAY = "M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z";
const ICON_PAUSE = "M 12,26 16,26 16,10 12,10 z M 21,26 25,26 25,10 21,10 z";
const ICON_PREV = "m 12,12 h 2 v 12 h -2 z m 3.5,6 8.5,6 V 12 z";
const ICON_NEXT = "M 12,24 20.5,18 12,12 V 24 z M 22,12 v 12 h 2 V 12 h -2 z";
const ICON_VOLUME_MUTE = "m 21.48,17.98 c 0,-1.77 -1.02,-3.29 -2.5,-4.03 v 2.21 l 2.45,2.45 c .03,-0.2 .05,-0.41 .05,-0.63 z m 2.5,0 c 0,.94 -0.2,1.82 -0.54,2.64 l 1.51,1.51 c .66,-1.24 1.03,-2.65 1.03,-4.15 0,-4.28 -2.99,-7.86 -7,-8.76 v 2.05 c 2.89,.86 5,3.54 5,6.71 z M 9.25,8.98 l -1.27,1.26 4.72,4.73 H 7.98 v 6 H 11.98 l 5,5 v -6.73 l 4.25,4.25 c -0.67,.52 -1.42,.93 -2.25,1.18 v 2.06 c 1.38,-0.31 2.63,-0.95 3.69,-1.81 l 2.04,2.05 1.27,-1.27 -9,-9 -7.72,-7.72 z m 7.72,.99 -2.09,2.08 2.09,2.09 V 9.98 z";
const ICON_VOLUME = "M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.26 20.48,14.74 19,14 Z";
const ICON_VOLUME_HIGH = "M19,11.29 C21.89,12.15 24,14.83 24,18 C24,21.17 21.89,23.85 19,24.71 L19,26.77 C23.01,25.86 26,22.28 26,18 C26,13.72 23.01,10.14 19,9.23 L19,11.29 Z";
const ICON_VOLUME_LOW = "M19,11.29 C21.89,12.15 24,14.83 24,18 C24,21.17 21.89,23.85 19,24.71 L19,24.77 C21.89,23.85 24,21.17 24,18 C24,14.83 21.89,12.15 19,11.29 L19,11.29 Z";
const ICON_SEEK_BACK = "M 18,11 V 7 l -5,5 5,5 v -4 c 3.3,0 6,2.7 6,6 0,3.3 -2.7,6 -6,6 -3.3,0 -6,-2.7 -6,-6 h -2 c 0,4.4 3.6,8 8,8 4.4,0 8,-3.6 8,-8 0,-4.4 -3.6,-8 -8,-8 z m -1.3,8.9 .2,-2.2 h 2.4 v .7 h -1.7 l -0.1,.9 c 0,0 .1,0 .1,-0.1 0,-0.1 .1,0 .1,-0.1 0,-0.1 .1,0 .2,0 h .2 c .2,0 .4,0 .5,.1 .1,.1 .3,.2 .4,.3 .1,.1 .2,.3 .3,.5 .1,.2 .1,.4 .1,.6 0,.2 0,.4 -0.1,.5 -0.1,.1 -0.1,.3 -0.3,.5 -0.2,.2 -0.3,.2 -0.4,.3 C 18.5,22 18.2,22 18,22 17.8,22 17.6,22 17.5,21.9 17.4,21.8 17.2,21.8 17,21.7 16.8,21.6 16.8,21.5 16.7,21.3 16.6,21.1 16.6,21 16.6,20.8 h .8 c 0,.2 .1,.3 .2,.4 .1,.1 .2,.1 .4,.1 .1,0 .2,0 .3,-0.1 L 18.5,21 c 0,0 .1,-0.2 .1,-0.3 v -0.6 l -0.1,-0.2 -0.2,-0.2 c 0,0 -0.2,-0.1 -0.3,-0.1 h -0.2 c 0,0 -0.1,0 -0.2,.1 -0.1,.1 -0.1,0 -0.1,.1 0,.1 -0.1,.1 -0.1,.1 h -0.7 z";
const ICON_SEEK_FORWARD = "m 10,19 c 0,4.4 3.6,8 8,8 4.4,0 8,-3.6 8,-8 h -2 c 0,3.3 -2.7,6 -6,6 -3.3,0 -6,-2.7 -6,-6 0,-3.3 2.7,-6 6,-6 v 4 l 5,-5 -5,-5 v 4 c -4.4,0 -8,3.6 -8,8 z m 6.7,.9 .2,-2.2 h 2.4 v .7 h -1.7 l -0.1,.9 c 0,0 .1,0 .1,-0.1 0,-0.1 .1,0 .1,-0.1 0,-0.1 .1,0 .2,0 h .2 c .2,0 .4,0 .5,.1 .1,.1 .3,.2 .4,.3 .1,.1 .2,.3 .3,.5 .1,.2 .1,.4 .1,.6 0,.2 0,.4 -0.1,.5 -0.1,.1 -0.1,.3 -0.3,.5 -0.2,.2 -0.3,.2 -0.5,.3 C 18.3,22 18.1,22 17.9,22 17.7,22 17.5,22 17.4,21.9 17.3,21.8 17.1,21.8 16.9,21.7 16.7,21.6 16.7,21.5 16.6,21.3 16.5,21.1 16.5,21 16.5,20.8 h .8 c 0,.2 .1,.3 .2,.4 .1,.1 .2,.1 .4,.1 .1,0 .2,0 .3,-0.1 L 18.4,21 c 0,0 .1,-0.2 .1,-0.3 v -0.6 l -0.1,-0.2 -0.2,-0.2 c 0,0 -0.2,-0.1 -0.3,-0.1 h -0.2 c 0,0 -0.1,0 -0.2,.1 -0.1,.1 -0.1,0 -0.1,.1 0,.1 -0.1,.1 -0.1,.1 h -0.6 z";

const SVG_NEXT_VIDEO = '<svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%"><path fill="#ffffff" d="M 12,24 20.5,18 12,12 V 24 z M 22,12 v 12 h 2 V 12 h -2 z"></path></svg>';
const SVG_ENTER_FULLSCREEN = '<svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%"><g class="html5-player__fullscreen-btn-corner-0"><path fill="#ffffff" d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z"></path></g><g class="html5-player__fullscreen-btn-corner-1"><path fill="#ffffff" d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z"></path></g><g class="html5-player__fullscreen-btn-corner-2"><path fill="#ffffff" d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z"></path></g><g class="html5-player__fullscreen-btn-corner-3"><path fill="#ffffff" d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z"></path></g></svg>';
const SVG_EXIT_FULLSCREEN = '<svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%"><g class="html5-player__fullscreen-btn-corner-2"><path fill="#ffffff" d="m 14,14 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z"></path></g><g class="html5-player__fullscreen-btn-corner-3"><path fill="#ffffff" d="m 22,14 0,-4 -2,0 0,6 6,0 0,-2 -4,0 0,0 z"></path></g><g class="html5-player__fullscreen-btn-corner-0"><path fill="#ffffff" d="m 20,26 2,0 0,-4 4,0 0,-2 -6,0 0,6 0,0 z"></path></g><g class="html5-player__fullscreen-btn-corner-1"><path fill="#ffffff" d="m 10,22 4,0 0,4 2,0 0,-6 -6,0 0,2 0,0 z"></path></g></svg>';


export class Player extends EventTarget {
  private playerElement: HTMLElement;
  private chromeElement: HTMLElement;

  private tooltip: Tooltip;
  private durationTooltipText: Text;
  private bezel: BezelElement;
  private progressBar: ProgressBarElement;

  private progressBarContainerElement: HTMLElement;

  private controlsElement: HTMLElement;
  private playButton: AnimationButton;

  private fullscreenButton: HTMLElement;

  private controlsTimeElement: HTMLElement;

  private videoWrapper: HTMLElement;
  private videoElement: HTMLVideoElement;

  private currentTimeText: Text = document.createTextNode("--:--");
  private durationText: Text = document.createTextNode("--:--");

  // TODO abstract this into another class
  private hls: Hls = new Hls();

  private subtitleEngine: SubtitleEngine = new LibAssSubtitle();

  private subtitles: Subtitle[] = [];

  private _elementListeners: IListener[] = [];

  // TODO abstract this into another class
  private stream: Stream;

  private handler = new EventHandler(this);

  private state: PlaybackState = PlaybackState.UNSTARTED;

  private _clickTimer: number;
  private _clickExecuted: boolean = false;

  private _autoHideTimer: number;
  private _autoHideTime: number = 3000;

  private _progressPlaying: boolean = false;
  private _progressDragging: boolean = false;
  private _preferAutoHide: boolean = true;

  private nextVideo: NextVideo;
  private nextVideoButton: HTMLElement;

  constructor() {
    super();

    this.playerElement = document.createElement("div");
    this.playerElement.setAttribute("tabindex", "-1");
    this.playerElement.className = "html5-player html5-player--auto-hide";

    this.videoWrapper = document.createElement("div");
    this.videoWrapper.className = "html5-player__video";

    this.videoElement = document.createElement("video");
    this.hls.attachMedia(this.videoElement);
    this.subtitleEngine.attach(this.videoElement);

    this.videoWrapper.appendChild(this.videoElement);
    this.videoWrapper.appendChild(this.subtitleEngine.getElement());

    this.subtitleEngine.getElement().className = "html5-player__subtitles";

    this.playerElement.appendChild(this.videoWrapper);

    this.tooltip = new Tooltip();

    this.playerElement.appendChild(this.tooltip.getElement());

    var gradiantElement = document.createElement("div");
    gradiantElement.className = "html5-player__gradiant html5-player__gradiant--bottom";

    this.playerElement.appendChild(gradiantElement);

    this.chromeElement = document.createElement("div");
    this.chromeElement.className = "html5-player__chrome";

    this.progressBar = new ProgressBarElement(this.playerElement);

    this.progressBarContainerElement = document.createElement("div");
    this.progressBarContainerElement.className = "html5-player__progress-bar-container";

    this.progressBarContainerElement.appendChild(this.progressBar.getElement());

    this.controlsElement = document.createElement("div");
    this.controlsElement.className = "html5-player__controls";

    var controlsLeft = document.createElement("div");
    controlsLeft.className = "html5-player__controls-left";

    this.playButton = new AnimationButton(ICON_PLAY);
    this.playButton.getElement().classList.add("html5-player__play-btn");

    controlsLeft.appendChild(this.playButton.getElement());

    this.nextVideoButton = document.createElement("a");
    this.nextVideoButton.className = "html5-player__button ";
    this.nextVideoButton.innerHTML = SVG_NEXT_VIDEO;
    this.nextVideoButton.style.display = "none";

    controlsLeft.appendChild(this.nextVideoButton);

    this.controlsTimeElement = document.createElement("div");
    this.controlsTimeElement.className = "html5-player__time";

    var timeCurrentElement = document.createElement("span");
    timeCurrentElement.className = "html5-player__time-current";
    timeCurrentElement.appendChild(this.currentTimeText);

    var timeSeparatorElement = document.createElement("span");
    timeSeparatorElement.className = "html5-player__time-separator";
    timeSeparatorElement.appendChild(document.createTextNode(" / "));

    var timeDurationElement = document.createElement("span");
    timeDurationElement.className = "html5-player__time-duration";
    timeDurationElement.appendChild(this.durationText);

    this.controlsTimeElement.appendChild(timeCurrentElement);
    this.controlsTimeElement.appendChild(timeSeparatorElement);
    this.controlsTimeElement.appendChild(timeDurationElement);

    controlsLeft.appendChild(this.controlsTimeElement);

    var controlsRight = document.createElement("div");
    controlsRight.className = "html5-player__controls-right";

    this.fullscreenButton = document.createElement("button");
    this.fullscreenButton.className = "html5-player__button html5-player__fullscreen-btn";
    this.fullscreenButton.innerHTML = SVG_ENTER_FULLSCREEN;

    controlsRight.appendChild(this.fullscreenButton);

    this.controlsElement.appendChild(controlsLeft);
    this.controlsElement.appendChild(controlsRight);

    this.chromeElement.appendChild(this.progressBarContainerElement);
    this.chromeElement.appendChild(this.controlsElement);

    this.bezel = new BezelElement();

    this.playerElement.appendChild(this.bezel.getElement());
    this.playerElement.appendChild(this.chromeElement);

    this.handler
      .listen(this.videoElement, "play", this.handlePlay)
      .listen(this.videoElement, "playing", this.handlePlay)
      .listen(this.videoElement, "pause", this.handlePause)
      .listen(this.videoElement, "ended", this.handleEnded)
      .listen(this.videoElement, "seeked", this.handleSeeked)
      .listen(this.videoElement, "seeking", this.handleSeeking)
      .listen(this.videoElement, "waiting", this.handleWaiting)
      .listen(this.videoElement, "volumechange", this.handleVolumeChange)
      .listen(this.videoElement, "durationchange", this.handleDurationChange)
      .listen(this.videoElement, "canplay", this.handleDurationChange)
      .listen(this.videoElement, "progress", this.handleProgress)
      .listen(this.videoElement, "timeupdate", this.handleTimeUpdate)
      .listen(this.playerElement, "keydown", this.handleKeyDown)

      .listen(this.playButton, 'click', this.togglePlay)
      .listen(this.fullscreenButton, 'click', this.toggleFullscreen)

      .listen(this.nextVideoButton, 'mouseover', this.handleNextVideoMouseOver)
      .listen(this.fullscreenButton, 'mouseover', this.handleFullscreenMouseOver)

      .listen(this.nextVideoButton, 'mouseout', this.handleElementTooltipMouseOut)
      .listen(this.fullscreenButton, 'mouseout', this.handleElementTooltipMouseOut)

      .listen(this.progressBar, "dragStart", this.handleProgressDragStart)
      .listen(this.progressBar, "drag", this.handleProgressDrag)
      .listen(this.progressBar, "dragEnd", this.handleProgressDragEnd)
      .listen(this.progressBar, "hover", this.handleProgressHover)

      .listen(this.videoElement, "loadedmetadata", this.handleLoadedMetadata)
      .listen(this.videoWrapper, "click", this.handleClickEvent)
      .listen(this.videoWrapper, "dblclick", this.handleDoubleClickEvent)
      .listen(this.playerElement, "mouseover", this.handleMouseOver)
      .listen(this.playerElement, "mouseout", this.handleMouseOut)
      .listen(this.playerElement, "mousemove", this.handleMouseMove)
      .listen(this.subtitleEngine, "resize", this.handleSubtitleResize)
      .listen(document, "fullscreenchange", this.handleFullscreenChange)
      .listen(document, "webkitfullscreenchange", this.handleFullscreenChange);
  }

  private setAutoHide(autoHide: boolean) {
    this._preferAutoHide = autoHide;
    if (!this._progressDragging) {
      if (autoHide) {
        this.playerElement.classList.add('html5-player--auto-hide');
      } else {
        this.playerElement.classList.remove('html5-player--auto-hide');
      }
    }

    this.progressBar.setUpdateDom(!autoHide);
  }

  private handleProgressHover(detail: IHover) {
    if (detail) {
      this.tooltip.setFlags(0);
      this.tooltip.setText(parseAndFormatTime(detail.time));

      this.tooltip.setVisible(true);

      this.repositionTooltipByPositionX(detail.x);
    } else {
      this.tooltip.setVisible(false);
    }
  }

  private handleProgressDragStart(value: number) {
    this._progressDragging = true;
    this._progressPlaying = this.getPlaybackState() === PlaybackState.PLAYING;
    this.pause();

    this.videoElement.currentTime = value;
  }

  private handleProgressDrag(value: number) {
    this.videoElement.currentTime = value;
  }

  private handleProgressDragEnd(value: number) {
    this._progressDragging = false;
    this.videoElement.currentTime = value;

    if (this._progressPlaying) {
      this.play();
    }

    if (this._preferAutoHide) {
      this.playerElement.classList.add('html5-player--auto-hide');
    } else {
      this.playerElement.classList.remove('html5-player--auto-hide');
    }
  }

  private onStateChange(state: PlaybackState): void {
    var icon = (state === PlaybackState.PLAYING ? ICON_PAUSE : ICON_PLAY);
    this.playButton.animate(icon);
  }

  private handlePlay(): void {
    this.state = PlaybackState.PLAYING;

    this.onStateChange(this.state);
  }

  private handlePause(): void {
    this.state = PlaybackState.PAUSED;

    this.onStateChange(this.state);
  }

  private handleEnded(): void {
    this.state = PlaybackState.ENDED;

    this.onStateChange(this.state);
  }

  private handleWaiting(): void {
    
  }

  private handleSeeked(): void {
    
  }

  private handleSeeking(): void {
    var value: number = 0;

    for (let i = 0; i < this.videoElement.buffered.length; i++) {
      value = Math.max(value, this.videoElement.buffered.end(i));
    }

    this.progressBar.setBufferingValue(value);
  }

  private handleProgress(): void {
    var value: number = 0;

    for (let i = 0; i < this.videoElement.buffered.length; i++) {
      value = Math.max(value, this.videoElement.buffered.end(i));
    }

    this.progressBar.setBufferingValue(value);
  }

  private handleVolumeChange(): void {
    
  }

  private handleTimeUpdate(): void {
    this.currentTimeText.textContent = parseAndFormatTime(this.currentTime);

    if (!this._progressDragging)
      this.progressBar.setValue(this.currentTime);
  }

  private handleDurationChange(): void {
    this.durationText.textContent = parseAndFormatTime(this.duration);

    this.progressBar.setMaxValue(this.duration);
  }

  private handleLoadedMetadata(): void {
    this.resize();

    this.handleTimeUpdate();
    this.handleDurationChange();

    this.play();
  }

  private handleFullscreenChange(): void {
    this.bezel.stop();
    this.tooltip.setVisible(false, true);

    if (this.isFullscreen()) {
      this.playerElement.classList.add("html5-player--big-mode");
      this.playerElement.classList.add("html5-player--fullscreen");

      this.fullscreenButton.innerHTML = SVG_EXIT_FULLSCREEN;
    } else {
      this.playerElement.classList.remove("html5-player--big-mode");
      this.playerElement.classList.remove("html5-player--fullscreen");

      this.fullscreenButton.innerHTML = SVG_ENTER_FULLSCREEN;
    }

    this.resize();
  }

  private handleMouseOver(e: MouseEvent): void {
    this.handleMouseMove(e);
  }

  private handleMouseOut(): void {
    this.setAutoHide(true);
  }

  private handleMouseMove(e: MouseEvent): void {
    window.clearTimeout(this._autoHideTimer);
    this.setAutoHide(false);

    if (e.target !== this.chromeElement && !this.chromeElement.contains(<Node> e.target)) {
      this._autoHideTimer = window.setTimeout(() => this.setAutoHide(true),
        this._autoHideTime);
    }
  }

  private handleSubtitleResize(): void {
    var rect = this.subtitleEngine.getRect();

    var el = <HTMLElement> this.subtitleEngine.getElement();
    el.style.width = rect.width + "px";
    el.style.height = rect.height + "px";
    el.style.left = rect.x + "px";

    var offset = this.videoWrapper.getBoundingClientRect().top
      - this.videoElement.getBoundingClientRect().top;
    el.style.top = (rect.y - offset) + "px";
  }

  private handleKeyDown(e: KeyboardEvent) {
    switch (e.keyCode) {
      case 32:
        var playing = this.getPlaybackState() === PlaybackState.PLAYING;
        if (playing) {
          this.bezel.playSvg(ICON_PAUSE);
          this.pause();
        } else {
          this.bezel.playSvg(ICON_PLAY);
          this.play();
        }
        break;
      // Left arrow
      case 37:
        this.bezel.playSvg(ICON_SEEK_BACK);
        this.seekTo(Math.max(this.currentTime - 5, 0));
        break;
      // Right arrow
      case 39:
        this.bezel.playSvg(ICON_SEEK_FORWARD);
        this.seekTo(Math.min(this.currentTime + 5, this.duration));
        break;
      // Up arrow
      case 38:
        this.bezel.playSvg(ICON_VOLUME + " " + ICON_VOLUME_HIGH);
        this.setVolume(Math.min(this.getVolume() + 5/100, 1));
        break;
      // Down arrow
      case 40:
        this.bezel.playSvg(ICON_VOLUME);
        this.setVolume(Math.max(this.getVolume() - 5/100, 0));
        break;
      // End
      case 35:
        this.seekTo(this.duration);
        break;
      // Home
      case 36:
        this.seekTo(0);
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  private handleClickEvent(): void {
    if (typeof this._clickTimer === "number") {
      window.clearTimeout(this._clickTimer);
      this._clickTimer = null;

      return;
    }

    if (this.getPlaybackState() === PlaybackState.PLAYING) {
      this.bezel.playSvg(ICON_PAUSE);
    } else {
      this.bezel.playSvg(ICON_PLAY);
    }

    this._clickExecuted = false;
    this._clickTimer = window.setTimeout(() => {
      this._clickTimer = null;
      this._clickExecuted = true;

      this.togglePlay();
    }, 200);
  }

  private handleDoubleClickEvent(): void {
    this.bezel.stop();
    if (this._clickExecuted) {
      this._clickExecuted = false;
      this.togglePlay();
    }

    this.toggleFullscreen();
  }

  private repositionTooltip(element: HTMLElement) {
    var rect = getOffsetRect(element, this.playerElement);

    this.repositionTooltipByPositionX(rect.left + rect.width/2);
  }

  private repositionTooltipByPositionX(x: number) {
    this.tooltip.setPosition(0, 0);

    var tooltipWidth = this.tooltip.getElement().offsetWidth;
    var tooltipHeight = this.tooltip.getElement().offsetHeight;

    var top = this.progressBar.getPaddingElementOffset().top - tooltipHeight;
    var left = x - tooltipWidth/2;

    var chromeLeft = this.chromeElement.offsetLeft;
    var chromeRight = this.chromeElement.offsetLeft
      + this.chromeElement.offsetWidth - tooltipWidth;

    left = Math.min(Math.max(chromeLeft, left), chromeRight);

    this.tooltip.setPosition(left, top);
  }

  private handleNextVideoMouseOver() {
    this.tooltip.setFlags(TooltipFlags.PREVIEW | TooltipFlags.TEXT_DETAIL);
    this.tooltip.setTitle("Next");
    this.tooltip.setText(this.nextVideo.episodeNumber
      + ": "
      + this.nextVideo.episodeTitle
    );

    this.tooltip.setSize(160, 90);
    this.tooltip.setBackground(this.nextVideo.thumbnailUrl, 160, 90);

    if (typeof this.nextVideo.duration === "number") {
      this.tooltip.addFlag(TooltipFlags.HAS_DURATION);
      this.tooltip.setDuration(this.nextVideo.duration);
    }

    this.tooltip.setVisible(true);

    this.repositionTooltip(this.nextVideoButton);
  }

  private handleFullscreenMouseOver() {
    this.tooltip.setFlags(0);
    this.tooltip.setText(this.isFullscreen() ? "Exit full screen" : "Full screen");

    this.tooltip.setVisible(true);

    this.repositionTooltip(this.fullscreenButton);
  }

  private handleElementTooltipMouseOut() {
    this.tooltip.setVisible(false);
  }

  protected disposeInternal() {
    super.disposeInternal();

    for (let i = 0; i < this._elementListeners.length; i++) {
      this._elementListeners[i].unlisten();
    }
    this._elementListeners = null;

    this.handler.dispose();
    this.handler = null;
  }

  private updateStream() {
    this.hls.loadSource(this.stream.url);
    this.subtitles = this.stream.subtitles;

    // Select default subtitle
    for (let i = 0; i < this.subtitles.length; i++) {
      if (!this.subtitles[i].isDefault()) continue;

      this.setSubtitle(i);
      break;
    }
  }

  setNextVideo(video: NextVideo) {
    this.nextVideo = video;

    if (this.nextVideo) {
      this.nextVideoButton.style.display = "";
      this.nextVideoButton.setAttribute("href", this.nextVideo.url);
    } else {
      this.nextVideoButton.style.display = "none";
      this.nextVideoButton.removeAttribute("href");
    }
  }

  resize() {

    // Update subtitle dimensions
    this.subtitleEngine.resize();
  }

  attach(el: Element) {
    el.appendChild(this.playerElement);
  }

  detach() {
    if (this.playerElement.parentNode) {
      this.playerElement.parentNode.removeChild(this.playerElement);
    }
  }

  setStream(stream: Stream) {
    if (stream === this.stream) return;

    this.stream = stream;
    this.updateStream();
  }

  setSubtitle(index: number) {
    if (index < 0 || index >= this.subtitles.length)
      throw new Error("index is out of bounds.");

    this.subtitleEngine.setTrack(this.subtitles[index]);
  }

  getPlaybackState(): PlaybackState {
    return this.state;
  }

  getSubtitles(): Subtitle[] {
    return this.stream.subtitles;
  }

  getQualityLevels(): Hls.Level[] {
    return this.hls.levels;
  }

  setQualityLevel(levelIndex: number) {
    this.hls.currentLevel = levelIndex;
  }

  getAudioTracks(): AudioTrack[] {
    return this.hls.audioTracks;
  }

  setAudioTrack(trackIndex: number) {
    this.hls.audioTrack = trackIndex;
  }

  get duration(): number {
    return this.videoElement.duration;
  }

  get currentTime(): number {
    return this.videoElement.currentTime;
  }

  togglePlay() {
    if (this.getPlaybackState() === PlaybackState.PLAYING) {
      this.pause();
    } else {
      this.play();
    }
  }

  toggleFullscreen() {
    if (this.isFullscreen()) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  play() {
    this.videoElement.play();
  }

  pause() {
    this.videoElement.pause();
  }

  seekTo(currentTime: number) {
    this.videoElement.currentTime = currentTime;
  }

  isMuted(): boolean {
    return this.videoElement.muted;
  }

  mute(): void {
    this.videoElement.muted = true;
  }

  unmute(): void {
    this.videoElement.muted = false;
  }

  getVolume(): number {
    return this.videoElement.volume;
  }

  setVolume(volume: number) {
    this.videoElement.volume = volume;
  }

  isFullscreen() {
    return document.webkitFullscreenElement === this.playerElement
      || document.fullscreenElement === this.playerElement;
  }

  enterFullscreen() {
    if (typeof this.playerElement.requestFullscreen === "function") {
      this.playerElement.requestFullscreen();
    } else if (typeof this.playerElement.webkitRequestFullScreen === "function") {
      this.playerElement.webkitRequestFullScreen();
    }
  }

  exitFullscreen() {
    if (!this.isFullscreen()) return;

    if (typeof document.exitFullscreen === "function") {
      document.exitFullscreen();
    } else if (typeof document.webkitExitFullscreen === "function") {
      document.webkitExitFullscreen();
    }
  }
}