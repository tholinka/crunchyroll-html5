import { h, Component } from "preact";
import { PlayPauseButton } from "./PlayPauseButton";
import { IPlayerApi, IVideoDetail } from "../IPlayerApi";
import { FullscreenButton } from "./FullscreenButton";
import { TimeDisplay } from "./TimeDisplay";
import { NextVideoButton } from "./NextVideoButton";
import { SizeButton } from "./SizeButton";

export interface IChromeControlsProps {
  api: IPlayerApi;
  onNextVideoHover: (detail: IVideoDetail) => void;
  onNextVideoEndHover: () => void;
  onSizeButtonHover: () => void;
  onSizeButtonEndHover: () => void;
  onFullscreenButtonHover: () => void;
  onFullscreenButtonEndHover: () => void;
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
          <SizeButton
            api={props.api}
            onHover={props.onSizeButtonHover}
            onEndHover={props.onSizeButtonEndHover}></SizeButton>
          <FullscreenButton
            api={props.api}
            onHover={props.onFullscreenButtonHover}
            onEndHover={props.onFullscreenButtonEndHover}></FullscreenButton>
        </div>
      </div>
    );
  }
}