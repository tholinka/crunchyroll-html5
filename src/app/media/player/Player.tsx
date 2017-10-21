import { h, Component, render } from 'preact';
import { ChromelessPlayer } from './ChromelessPlayer';
import { HlsSource } from './HlsSource';
import { ISource } from './ISource';
import { Subtitle } from '../video';
import { ISubtitleTrack } from '../subtitles/ISubtitleTrack';
import { requestFullscreen, exitFullscreen, getFullscreenElement } from '../../utils/fullscreen';
import { ChromeBottomComponent } from './chrome/ChromeBottomComponent';
import { parseSimpleQuery } from '../../utils/url';
import { IPlayerApi } from './IPlayerApi';
import { ChromelessPlayerApi } from './ChromelessPlayerApi';

export interface IPlayerProps {
  config?: IPlayerConfig
  large?: boolean
}

export interface IPlayerConfig {
  title?: string;
  url?: string;
  thumbnailUrl?: string;
  subtitles?: Subtitle[];
}

export class Player extends Component<IPlayerProps, {}> {
  private _config: IPlayerConfig|undefined = undefined;
  private _chromelessPlayer: ChromelessPlayer;
  private _element: Element;
  private _large: boolean = false;
  private _api: IPlayerApi = new ChromelessPlayerApi();

  constructor(props: IPlayerProps) {
    super(props);

    if (props.config) {
      this._config = props.config;
    }
    this._large = !!props.large;
  }

  loadVideoByConfig(config: IPlayerConfig) {
    this._updateChromelessPlayer(config);
  }

  private async _updateChromelessPlayer(config: IPlayerConfig) {
    if (config.subtitles) {
      const tracks: ISubtitleTrack[] = [];
      let defaultTrack: number = 0;
      let selectedSubtitleId: number|undefined = undefined;
      let queries = parseSimpleQuery(location.search);

      for (let i = 0; i < config.subtitles.length; i++) {
        let useSubtitle = false;
        if (queries.hasOwnProperty('ssid')) {
          let id: string = queries['ssid'];
          useSubtitle = config.subtitles[i].id === id;
        } else {
          useSubtitle = config.subtitles[i].isDefault;
        }
        if (useSubtitle) {
          defaultTrack = i;
        }
        
        let subtitle = config.subtitles[i];
        tracks.push({
          label: subtitle.title,
          getContent: async (): Promise<string> => {
            return (await subtitle.getContent()).toAss();
          }
        });
      }
      this._chromelessPlayer.setSubtitleTracks(tracks);
      this._chromelessPlayer.setSubtitleTrack(defaultTrack);
    }

    if (config.url) {
      this._chromelessPlayer.setVideoSource(new HlsSource(config.url));
    }
  }

  setLarge(large: boolean): void {
    this._large = large;

    this._updateSize();
  }

  getApi(): IPlayerApi {
    return this._api;
  }

  private _updateSize(): void {
    if (this._large) {
      this._element.classList.add("html5-video-player--large");
    } else {
      this._element.classList.remove("html5-video-player--large");
    }
  }

  resize() {
    this._chromelessPlayer.resize();
  }

  componentDidMount() {
    if (this._config) {
      this._updateChromelessPlayer(this._config);
    }

    this._updateSize();
    this.resize();
  }

  render(props: IPlayerProps): JSX.Element {
    const chromelessRef = (el: ChromelessPlayer) => {
      this._chromelessPlayer = el;
    };
    const ref = (el: HTMLElement) => {
      this._element = el;
    };

    const className = "html5-video-player"
      + (this._large ? " html5-video-player--large" : "");
    return (
      <div class={className} ref={ref}>
        <ChromelessPlayer ref={chromelessRef} api={this.getApi() as ChromelessPlayerApi}></ChromelessPlayer>
        <ChromeBottomComponent api={this.getApi()}></ChromeBottomComponent>
      </div>
    );
  }
}