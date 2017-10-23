import { h, Component } from "preact";
import { PlayPauseButton } from "./PlayPauseButton";
import { IPlayerApi, IVideoDetail } from "../IPlayerApi";
import { FullscreenButton } from "./FullscreenButton";
import { TimeDisplay } from "./TimeDisplay";
import { NextVideoButton } from "./NextVideoButton";

export interface IChromeControlsProps {
  api: IPlayerApi;
  onNextVideoHover: (detail: IVideoDetail) => void;
  onNextVideoEndHover: () => void;
}

export class ChromeControlsComponent extends Component<IChromeControlsProps, {}> {
  render(props: IChromeControlsProps): JSX.Element {
    return (
      <div class="chrome-controls">
        <div class="chrome-controls__left">
          <PlayPauseButton api={props.api}></PlayPauseButton>
          <NextVideoButton
            api={props.api}
            onHover={props.onNextVideoHover}
            onEndHover={props.onNextVideoEndHover}></NextVideoButton>
          <TimeDisplay api={props.api}></TimeDisplay>
        </div>
        <div class="chrome-controls__right">
          <FullscreenButton api={props.api}></FullscreenButton>
        </div>
      </div>
    );
  }
}