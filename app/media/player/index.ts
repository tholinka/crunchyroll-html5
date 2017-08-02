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
import { VolumeSvg, VolumeSvgState } from './volume-svg';
import { VolumeSlider } from './volume-slider';
import { Tooltip, Flags as TooltipFlags } from './tooltip';
import { getOffsetRect, getClientRect, IRect } from '../../utils/offset';

import { SubtitleEngine } from './subtitles/isubtitle';
import { LibAssSubtitle } from './subtitles/libass';

import {
  ICON_PLAY, ICON_PAUSE, ICON_SEEK_BACK, ICON_SEEK_FORWARD, ICON_VOLUME,
  ICON_VOLUME_HIGH, ICON_SIZE_SMALL, ICON_SIZE_LARGE
} from '../../assets/svg-paths';

export enum PlaybackState {
  UNSTARTED, PLAYING, PAUSED, BUFFERING, ENDED
}

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
  private volumeButton: HTMLElement;
  private volumeButtonTitleText: Text = document.createTextNode("");
  private volumeSvg: VolumeSvg;
  private volumeSlider: VolumeSlider;
  private _volumeSliderPreferActive: boolean = false;

  private fullscreenButton: HTMLElement;
  private sizeButton: HTMLElement;
  private sizeButtonPath: SVGElement;
  private sizeButtonTitleText: Text = document.createTextNode("");

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

  private _dragging: boolean = false;
  private _preferAutoHide: boolean = true;

  private nextVideo: NextVideo;
  private nextVideoButton: HTMLElement;

  private wide: boolean = false;

  constructor() {
    super();

    this.playerElement = document.createElement("div");
    this.playerElement.setAttribute("tabindex", "-1");
    this.playerElement.className = "html5-player"
      + (this.wide ? " html5-player--wide" : "");

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
    this.nextVideoButton.className = "html5-player__button";
    this.nextVideoButton.innerHTML = SVG_NEXT_VIDEO;
    this.nextVideoButton.style.display = "none";

    controlsLeft.appendChild(this.nextVideoButton);

    var volumeWrapper = document.createElement("span");
    this.volumeButton = document.createElement("button");
    this.volumeButton.className = "html5-player__button";
    this.volumeSvg = new VolumeSvg();
    this.volumeButton.appendChild(this.volumeSvg.getElement());

    volumeWrapper.appendChild(this.volumeButton);

    this.volumeSlider = new VolumeSlider(this.getVolume(), 0, 1);
    volumeWrapper.appendChild(this.volumeSlider.getElement());

    controlsLeft.appendChild(volumeWrapper);

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

    this.sizeButton = document.createElement("button");
    this.sizeButton.className = "html5-player__button html5-player__size-btn";

    var sizeButtonSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sizeButtonSvg.setAttribute("width", "100%");
    sizeButtonSvg.setAttribute("height", "100%");
    sizeButtonSvg.setAttribute("version", "1.1");
    sizeButtonSvg.setAttribute("viewBox", "0 0 36 36");

    this.sizeButtonPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.sizeButtonPath.setAttribute("d", this.wide ? ICON_SIZE_SMALL : ICON_SIZE_LARGE);
    this.sizeButtonPath.setAttribute("fill", "#ffffff");
    this.sizeButtonPath.setAttribute("fill-rule", "evenodd");

    sizeButtonSvg.appendChild(this.sizeButtonPath);

    this.sizeButton.appendChild(sizeButtonSvg);
    controlsRight.appendChild(this.sizeButton);

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
      .listen(this.playerElement, "mousedown", this.handleMouseDown)
      .listen(document, "mouseup", this.handleMouseUp)

      .listen(controlsLeft, 'mouseleave', this.handleLeftControlsMouseLeave)
      .listen(this.volumeSlider.getElement(), 'blur', this.handleVolumeSliderBlur)
      .listen(this.volumeSlider, 'change', this.handleVolumeSliderChange)

      .listen(this.playButton, 'click', this.togglePlay)
      .listen(this.fullscreenButton, 'click', this.toggleFullscreen)
      .listen(this.sizeButton, 'click', this.toggleWide)

      .listen(this.volumeButton, 'click', this.handleVolumeButtonClick)

      .listen(this.volumeButton, 'mouseenter', this.handleVolumeButtonMouseEnter)
      .listen(this.nextVideoButton, 'mouseenter', this.handleNextVideoMouseEnter)
      .listen(this.fullscreenButton, 'mouseenter', this.handleFullscreenMouseEnter)
      .listen(this.sizeButton, 'mouseenter', this.handleSizeMouseEnter)

      .listen(this.volumeButton, 'mouseleave', this.handleElementTooltipMouseLeave)
      .listen(this.nextVideoButton, 'mouseleave', this.handleElementTooltipMouseLeave)
      .listen(this.fullscreenButton, 'mouseleave', this.handleElementTooltipMouseLeave)
      .listen(this.sizeButton, 'mouseleave', this.handleElementTooltipMouseLeave)

      .listen(this.progressBar, "dragStart", this.handleProgressDragStart)
      .listen(this.progressBar, "drag", this.handleProgressDrag)
      .listen(this.progressBar, "dragEnd", this.handleProgressDragEnd)
      .listen(this.progressBar, "hover", this.handleProgressHover)

      .listen(this.videoElement, "loadedmetadata", this.handleLoadedMetadata)
      .listen(this.videoWrapper, "click", this.handleClickEvent)
      .listen(this.videoWrapper, "dblclick", this.handleDoubleClickEvent)
      .listen(this.playerElement, "mouseenter", this.handleMouseEnter)
      .listen(this.playerElement, "mouseleave", this.handleMouseLeave)
      .listen(this.playerElement, "mousemove", this.handleMouseMove)
      .listen(this.subtitleEngine, "resize", this.handleSubtitleResize)
      .listen(document, "fullscreenchange", this.handleFullscreenChange)
      .listen(document, "webkitfullscreenchange", this.handleFullscreenChange);
    
    this.updateAutoHideInternal();
  }

  private updateAutoHideInternal() {
    const canAutoHide: boolean =  !this._dragging
      && this.getPlaybackState() === PlaybackState.PLAYING
      && this._preferAutoHide;
    if (canAutoHide) {
      this.playerElement.classList.add('html5-player--auto-hide');
    } else {
      this.playerElement.classList.remove('html5-player--auto-hide');
    }
    this.progressBar.setUpdateDom(!canAutoHide);
  }

  setAutoHide(autoHide: boolean) {
    this._preferAutoHide = autoHide;
    
    this.updateAutoHideInternal();
  }

  private handleMouseDown() {
    this._dragging = true;
  }

  private handleMouseUp() {
    this._dragging = false;

    this.updateAutoHideInternal();
  }

  private handleProgressHover(detail: IHover) {
    if (detail) {
      this.tooltip.setFlags(0);
      this.tooltip.setTextContent(parseAndFormatTime(detail.time));

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
  }

  private onStateChange(state: PlaybackState): void {
    var icon = (state === PlaybackState.PLAYING ? ICON_PAUSE : ICON_PLAY);
    this.playButton.animate(icon);

    this.updateAutoHideInternal();
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
    var volume = this.getVolume();
    var muted = this.isMuted() || volume === 0;
    if (muted) {
      this.volumeSvg.setState(VolumeSvgState.MUTED);
    } else {
      if (volume < 0.5) {
        this.volumeSvg.setState(VolumeSvgState.LOW);
      } else {
        this.volumeSvg.setState(VolumeSvgState.HIGH);
      }
    }

    this.volumeButtonTitleText.textContent = muted ? "Unmute" : "Mute";
    this.volumeSlider.setValue(volume);
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

  private setBigMode(enabled: boolean) {
    if (enabled) {
      this.playerElement.classList.add("html5-player--big-mode");
    } else {
      this.playerElement.classList.remove("html5-player--big-mode");
    }
    this.volumeSlider.setBigMode(enabled);
    this.progressBar.updateDom();
  }

  private handleFullscreenChange(): void {
    this.bezel.stop();
    this.tooltip.setVisible(false, true);

    const fullscreen = this.isFullscreen();
    if (fullscreen) {
      this.playerElement.classList.add("html5-player--fullscreen");

      this.fullscreenButton.innerHTML = SVG_EXIT_FULLSCREEN;
    } else {
      this.playerElement.classList.remove("html5-player--fullscreen");

      this.fullscreenButton.innerHTML = SVG_ENTER_FULLSCREEN;
    }

    this.resize();
    this.setBigMode(fullscreen);
  }

  private handleMouseEnter(e: MouseEvent): void {
    this.handleMouseMove(e);
  }

  private handleMouseLeave(): void {
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
    const wrapperRect = this.videoWrapper.getBoundingClientRect();
    const videoRect = this.videoElement.getBoundingClientRect();

    var el = <HTMLElement> this.subtitleEngine.getElement();
    el.style.width = rect.width + "px";
    el.style.height = rect.height + "px";

    var offsetLeft = wrapperRect.left - videoRect.left;
    var offsetTop = wrapperRect.top - videoRect.top;

    el.style.left = (rect.x - offsetLeft) + "px";
    el.style.top = (rect.y - offsetTop) + "px";
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

  private handleLeftControlsMouseLeave() {
    if (document.activeElement === this.volumeSlider.getElement()) {
      this._volumeSliderPreferActive = false;
    } else {
      this.volumeSlider.getElement().classList
        .remove('html5-player-volume-panel--active');
    }
  }

  private handleVolumeSliderChange(value) {
    this.setVolume(value);
  }

  private handleVolumeSliderBlur() {
    if (!this._volumeSliderPreferActive) {
      this.volumeSlider.getElement().classList
        .remove('html5-player-volume-panel--active');
    }
  }

  private handleVolumeButtonClick() {
    if (this.isMuted()) {
      this.unmute();
    } else if (this.getVolume() === 0) {
      this.setVolume(1);
    } else {
      this.mute();
    }
  }

  private handleVolumeButtonMouseEnter() {
    this.tooltip.setFlags(0);
    this.volumeButtonTitleText.textContent = 
      this.isMuted() || this.getVolume() === 0 ? "Unmute" : "Mute";
    this.tooltip.setText(this.volumeButtonTitleText);

    this.tooltip.setVisible(true);

    this.repositionTooltip(this.volumeButton);

    this.volumeSlider.getElement().classList
      .add('html5-player-volume-panel--active');
    this._volumeSliderPreferActive = true;
  }

  private handleNextVideoMouseEnter() {
    this.tooltip.setFlags(TooltipFlags.PREVIEW | TooltipFlags.TEXT_DETAIL);
    this.tooltip.setTitle("Next");
    this.tooltip.setTextContent(this.nextVideo.episodeNumber
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

  private handleFullscreenMouseEnter() {
    this.tooltip.setFlags(0);
    this.tooltip.setTextContent(this.isFullscreen() ? "Exit full screen" : "Full screen");

    this.tooltip.setVisible(true);

    this.repositionTooltip(this.fullscreenButton);
  }

  private handleSizeMouseEnter() {
    this.tooltip.setFlags(0);
    this.sizeButtonTitleText.textContent =  this.wide ? "Default" : "Wide";
    this.tooltip.setTextContent(this.isFullscreen() ? "Exit full screen" : "Full screen");
    this.tooltip.setText(this.sizeButtonTitleText);

    this.tooltip.setVisible(true);

    this.repositionTooltip(this.sizeButton);
  }

  private handleElementTooltipMouseLeave() {
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
    this.resizeVideo();

    // Update subtitle dimensions
    this.subtitleEngine.resize();

    this.volumeSlider.updateDom();
    this.progressBar.updateDom();
  }

  private resizeVideo() {
    const videoWidth: number = this.videoElement.videoWidth;
    const videoHeight: number = this.videoElement.videoHeight;

    var maxWidth: number = this.videoWrapper.offsetWidth;
    var maxHeight: number = this.videoWrapper.offsetHeight;
    if (this.isFullscreen()) {
      maxWidth = screen.width;
      maxHeight = screen.height;
    }

    const videoRatio = videoWidth / videoHeight;
    const elementRatio = maxWidth / maxHeight;

    var realWidth = maxWidth;
    var realHeight = maxHeight;

    if (elementRatio > videoRatio) {
      realWidth = Math.floor(maxHeight * videoRatio);
    } else {
      realHeight = Math.floor(maxWidth / videoRatio);
    }

    this.videoElement.style.width = realWidth + "px";
    this.videoElement.style.height = realHeight + "px";
    this.videoElement.style.left = ((maxWidth - realWidth) / 2) + "px";
    this.videoElement.style.top = ((maxHeight - realHeight) / 2) + "px";
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

  toggleWide(): void {
    this.setWide(!this.wide);

    this.dispatchEvent('widechange', this.wide);
  }

  setWide(wide: boolean): void {
    this.wide = wide;
    
    if (this.sizeButtonPath) {
      this.sizeButtonPath.setAttribute("d", this.wide ? ICON_SIZE_SMALL : ICON_SIZE_LARGE);
    }

    if (this.playerElement) {
      if (wide) {
        this.playerElement.classList.add("html5-player--wide")
      } else {
        this.playerElement.classList.remove("html5-player--wide")
      }
    }

    this.resize();
  }

  getVolume(): number {
    return this.videoElement.volume;
  }

  /**
   * Set the volume.
   * @param volume Volume ranges between 0 and 1.
   */
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