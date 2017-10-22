import { h, Component } from "preact";
import { ChromeControlsComponent } from './ChromeControlsComponent';
import { ChromeProgressBarComponent } from "./ChromeProgressBarComponent";
import { IPlayerApi } from "../IPlayerApi";

export interface IChromeBottomProps {
  api: IPlayerApi;
  onProgressHover: (time: number, percentage: number) => void;
  onProgressEndHover: () => void;
}

export class ChromeBottomComponent extends Component<IChromeBottomProps, {}> {
  private _progressBar: ChromeProgressBarComponent;

  setInternalVisibility(visiblity: boolean): void {
    this._progressBar.setInternalVisibility(visiblity);
  }

  render(props: IChromeBottomProps): JSX.Element {
    const progressBarRef = (el: ChromeProgressBarComponent) => this._progressBar = el;
    return (
      <div class="html5-video-chrome-bottom">
        <ChromeProgressBarComponent
          ref={progressBarRef}
          api={props.api}
          onHover={props.onProgressHover}
          onEndHover={props.onProgressEndHover}></ChromeProgressBarComponent>
        <ChromeControlsComponent api={props.api}></ChromeControlsComponent>
      </div>
    );
  }
}