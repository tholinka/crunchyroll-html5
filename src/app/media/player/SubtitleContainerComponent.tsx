import { h, Component } from 'preact';
import { ISource } from './ISource';
import { ISubtitleTrack } from '../subtitles/ISubtitleTrack';
import { EventHandler } from '../../libs/events/EventHandler';
import { BrowserEvent } from '../../libs/events/BrowserEvent';
import { ISubtitleEngine } from '../subtitles/ISubtitleEngine';

export interface ISubtitleContainerProps {
  engine: ISubtitleEngine;
}

export class SubtitleContainerComponent extends Component<ISubtitleContainerProps, {}> {
  constructor() {
    super();
  }
  
  render(props: ISubtitleContainerProps): JSX.Element {
    const ref = (element: HTMLElement) => {
      element.appendChild(props.engine.getElement());
    };
    return (
      <div class="html5-subtitle-container" ref={ ref }></div>
    );
  }
}