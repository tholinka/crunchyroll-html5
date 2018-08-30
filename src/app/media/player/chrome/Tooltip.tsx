import { Component, h } from 'preact';
import { ISize } from '../../../utils/size';

export interface IChromeTooltip {
  backgroundImage?: IChromeTooltipImage;
  duration?: string;
  title?: string;
  text?: string;
  textDetail?: boolean;
  hasDuration?: boolean;
  preview?: boolean;
}

export interface IChromeTooltipImage {
  width: number;
  height: number;
  src: string;
}

export class ChromeTooltip extends Component<{}, {}> {
  private _bgElement?: HTMLElement;
  private _durationElement?: Element;
  private _imageElement?: Element;
  private _titleElement?: Element;
  private _textElement?: HTMLElement;

  public setPosition(left: number, top: number): void {
    if (!this.base) throw new Error('Base is undefined');
    this.base.style.left = left + 'px';
    this.base.style.top = top + 'px';
  }

  public getSize(): ISize {
    if (!this._textElement || !this.base) return { width: 0, height: 0 };

    return {
      width: Math.max(this.base.offsetWidth, this._textElement.offsetWidth),
      height: Math.max(this.base.offsetHeight, this._textElement.offsetHeight)
    };
  }

  public setTooltip(tooltip: IChromeTooltip) {
    if (!this.base) throw new Error('Base is undefined');
    this.base.style.display = '';

    if (this._bgElement) {
      if (tooltip.backgroundImage) {
        this._bgElement.style.width = tooltip.backgroundImage.width + 'px';
        this._bgElement.style.height = tooltip.backgroundImage.height + 'px';
        this._bgElement.style.background =
          'url(' + JSON.stringify(tooltip.backgroundImage.src) + ')';
        this._bgElement.style.backgroundSize =
          this._bgElement.style.width + ' ' + this._bgElement.style.height;
      } else {
        this._bgElement.style.width = '';
        this._bgElement.style.height = '';
        this._bgElement.style.background = '';
        this._bgElement.style.backgroundSize = '';
      }
    }

    if (this._durationElement) {
      if (tooltip.duration) {
        this._durationElement.textContent = tooltip.duration;
      } else {
        this._durationElement.textContent = '';
      }
    }

    if (this._titleElement) {
      if (tooltip.title) {
        this._titleElement.textContent = tooltip.title;
      } else {
        this._titleElement.textContent = '';
      }
    }

    if (this._textElement) {
      if (tooltip.text) {
        this._textElement.textContent = tooltip.text;
      } else {
        this._textElement.textContent = '';
      }
    }

    if (tooltip.preview) {
      this.base.classList.add('chrome-preview');
    } else {
      this.base.classList.remove('chrome-preview');
    }

    if (tooltip.textDetail) {
      this.base.classList.add('chrome-text-detail');
    } else {
      this.base.classList.remove('chrome-text-detail');
    }

    if (tooltip.hasDuration) {
      this.base.classList.add('chrome-has-duration');
    } else {
      this.base.classList.remove('chrome-has-duration');
    }
  }

  public render(): JSX.Element {
    const bgRef = (el?: Element) => (this._bgElement = el as HTMLElement);
    const durationRef = (el?: Element) => (this._durationElement = el);
    const imageRef = (el?: Element) => (this._imageElement = el);
    const titleRef = (el?: Element) => (this._titleElement = el);
    const textRef = (el?: Element) => (this._textElement = el as HTMLElement);

    return (
      <div class="chrome-tooltip chrome-bottom" style="display: none;">
        <div class="chrome-tooltip-bg" ref={bgRef}>
          <div class="chrome-tooltip-duration" ref={durationRef} />
        </div>
        <div class="chrome-tooltip-text-wrapper">
          <div class="chrome-tooltip-image" ref={imageRef} />
          <div class="chrome-tooltip-title" ref={titleRef} />
          <span class="chrome-tooltip-text" ref={textRef} />
        </div>
      </div>
    );
  }
}
