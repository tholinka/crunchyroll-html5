import { h, Component } from 'preact';
import { ChromelessPlayer } from './ChromelessPlayer';
import { HlsSource } from './HlsSource';
import { ISource } from './ISource';

export interface IPlayerProps {
  config: IPlayerConfig
}

export interface IPlayerConfig {
  title?: string;
  url?: string;
  thumbnailUrl?: string;
}

export class Player extends Component<IPlayerProps, {}> {
  private _config: IPlayerConfig|undefined = undefined;

  constructor() {
    super();
  }

  loadVideoByConfig(config: IPlayerConfig) {
    
  }

  private loadConfig(config: IPlayerConfig) {

  }

  render(props: IPlayerProps): JSX.Element {
    const config = this._config || props.config;

    let src: ISource|undefined = undefined;

    if (config.url) {
      src = new HlsSource(config.url);
    }

    return (
      <div class="html5-video-player">
        <ChromelessPlayer src={src}></ChromelessPlayer>
      </div>
    );
  }
}