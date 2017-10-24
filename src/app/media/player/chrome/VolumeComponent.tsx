import { h, Component } from "preact";
import { IPlayerApi } from "../IPlayerApi";

export interface IVolumeComponentProps {
  api: IPlayerApi
}

export class VolumeComponent extends Component<IVolumeComponentProps, {}> {


  render(): JSX.Element {
    return (
      <span>
        <button class="chrome-mute-button chrome-button">

        </button>
      </span>
    );
  }
}