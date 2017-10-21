import { h, Component } from "preact";
import { ChromeControlsComponent } from './ChromeControlsComponent';
import { ChromeProgressBarComponent } from "./ChromeProgressBarComponent";
import { IPlayerApi } from "../IPlayerApi";

export interface IChromeBottomProps {
  api: IPlayerApi
}

export class ChromeBottomComponent extends Component<IChromeBottomProps, {}> {
  render(props: IChromeBottomProps): JSX.Element {
    return (
      <div class="html5-video-chrome-bottom">
        <ChromeProgressBarComponent></ChromeProgressBarComponent>
        <ChromeControlsComponent api={props.api}></ChromeControlsComponent>
      </div>
    );
  }
}