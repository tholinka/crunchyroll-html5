import { Component, h } from 'preact';
import { ISubtitleEngine } from '../subtitles/ISubtitleEngine';

export interface ISubtitleContainerProps {
  engine: ISubtitleEngine;
}

export class SubtitleContainerComponent extends Component<ISubtitleContainerProps, {}> {
  constructor() {
    super();
  }
  
  public render(props: ISubtitleContainerProps): JSX.Element {
    const ref = (element?: Element) => {
      if (!element) return;
      
      element.appendChild(props.engine.getElement());
    };
    return (
      <div class="html5-subtitle-container" ref={ ref } />
    );
  }
}