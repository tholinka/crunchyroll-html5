import { h, Component } from "preact";
import { IPlayerApi } from "../IPlayerApi";

export interface IVolumeSliderComponentProps {
  api: IPlayerApi
}

export class VolumeSliderComponent extends Component<IVolumeSliderComponentProps, {}> {


  render(): JSX.Element {
    return (
      <div></div>
    );
  }
}