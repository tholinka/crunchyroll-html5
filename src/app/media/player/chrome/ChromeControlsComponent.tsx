import { h, Component } from "preact";
import { PlayPauseButton } from "./PlayPauseButton";
import { IPlayerApi } from "../IPlayerApi";

export interface IChromeControlsProps {
  api: IPlayerApi
}

export class ChromeControlsComponent extends Component<IChromeControlsProps, {}> {
  render(props: IChromeControlsProps): JSX.Element {
    return (
      <div class="chrome-controls">
        <div class="chrome-controls__left">
          <PlayPauseButton api={props.api}></PlayPauseButton>
        </div>
        <div class="chrome-controls__right">
          
        </div>
      </div>
    );
  }
}