import { h, Component } from 'preact';

export interface IPlayerProps {

}

export interface IPlayerConfig {
  
}

export class Player extends Component<IPlayerProps, {}> {
  constructor() {
    super();
  }

  loadVideoByConfig(config: IPlayerConfig) {

  }

  render(): JSX.Element {
    return (
      <div class="html5-video-player">

      </div>
    );
  }
}