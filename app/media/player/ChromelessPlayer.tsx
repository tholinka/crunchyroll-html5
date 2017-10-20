import { h, Component } from 'preact';
import { ISource } from './ISource';
import { ISubtitleTrack } from './ISubtitleTrack';

export interface IChromelessPlayerProps {

}

export class ChromelessPlayer extends Component<IChromelessPlayerProps, {}> {
  private _videoElement: HTMLVideoElement|undefined = undefined;
  private _source: ISource|undefined = undefined;

  constructor() {
    super();
  }

  render(): JSX.Element {
    const attributes: {[key: string]: string} = {
      'controlslist': 'nodownload'
    };
    const ref = (videoElement: HTMLVideoElement) => {
      this._videoElement = videoElement;
      if (this._source) {
        this._source.attach(this._videoElement);
      }
    };
    return (
      <div class="html5-video-container">
        <video ref={ref} class="video-stream" { ...attributes }></video>
      </div>
    );
  }

  setVideoSource(source: ISource): void {
    if (this._source) {
      this._source.detach();
    }
    this._source = source;

    if (this._videoElement) {
       this._source.attach(this._videoElement);
    }
  }

  setSubtitleTrack(track: ISubtitleTrack): void {

  }
}