import { isMac } from '../platform/navigator';
import { Event as MyEvent } from './Event';
import { MouseButton } from './MouseButton';

declare interface ISpecialKeyboardEvent extends Event {
  keyCode: number;
  ctrlKey: boolean;
}

export class BrowserEvent extends MyEvent {
  public relatedTarget: EventTarget|null = null;
  public offsetX: number = 0;
  public offsetY: number = 0;
  public clientX: number = 0;
  public clientY: number = 0;
  public screenX: number = 0;
  public screenY: number = 0;
  public button: MouseButton = MouseButton.LEFT;
  public key: string = '';
  public keyCode: number = 0;
  public charCode: number = 0;
  public ctrlKey: boolean = false;
  public altKey: boolean = false;
  public shiftKey: boolean = false;
  public metaKey: boolean = false;
  public state: object|null = null;
  public platformModifierKey: boolean = false;
  public detail: any = undefined;

  private _event?: Event;

  constructor(event?: Event, currentTarget?: EventTarget) {
    super(event ? event.type : '');

    if (event) {
      this.init(event, currentTarget);
    }
  }

  public init(event: Event, currentTarget?: EventTarget) {
    const type = this.type = event.type;
  
    /**
     * On touch devices use the first "changed touch" as the relevant touch.
     */
    const touchEvent = event as TouchEvent;
    const relevantTouch: Touch|undefined = (touchEvent.changedTouches ? touchEvent.changedTouches[0] : undefined);
    
    this.target = event.target || event.srcElement || undefined;
  
    this.currentTarget = currentTarget;
  
    const mouseEvent = event as MouseEvent;
    let relatedTarget = mouseEvent.relatedTarget;
    if (relatedTarget) {
      
    } else if (type === 'mouseover') {
      relatedTarget = mouseEvent.fromElement;
    } else if (type === 'mouseout') {
      relatedTarget = mouseEvent.toElement;
    }
  
    this.relatedTarget = relatedTarget;
  
    if (!!relevantTouch) {
      this.clientX = relevantTouch.clientX !== undefined ? relevantTouch.clientX :
                                                            relevantTouch.pageX;
      this.clientY = relevantTouch.clientY !== undefined ? relevantTouch.clientY :
                                                            relevantTouch.pageY;
      this.screenX = relevantTouch.screenX || 0;
      this.screenY = relevantTouch.screenY || 0;
    } else {
      this.offsetX = mouseEvent.offsetX !== undefined ? mouseEvent.offsetX : mouseEvent.layerX;
      this.offsetY = mouseEvent.offsetY !== undefined ? mouseEvent.offsetY : mouseEvent.layerY;
      this.clientX = mouseEvent.clientX !== undefined ? mouseEvent.clientX : mouseEvent.pageX;
      this.clientY = mouseEvent.clientY !== undefined ? mouseEvent.clientY : mouseEvent.pageY;
      this.screenX = mouseEvent.screenX || 0;
      this.screenY = mouseEvent.screenY || 0;
    }
  
    this.button = mouseEvent.button;
  
    const keyEvent = event as KeyboardEvent;
    this.keyCode = keyEvent.keyCode || 0;
    this.key = keyEvent.key || '';
    this.charCode = keyEvent.charCode || (type === 'keypress' ? keyEvent.keyCode : 0);
    this.ctrlKey = keyEvent.ctrlKey;
    this.altKey = keyEvent.altKey;
    this.shiftKey = keyEvent.shiftKey;
    this.metaKey = keyEvent.metaKey;
    this.platformModifierKey = isMac ? keyEvent.metaKey : keyEvent.ctrlKey;

    const popStateEvent = event as PopStateEvent;
    this.state = popStateEvent.state;

    const customEvent = event as CustomEvent;
    this.detail = customEvent.detail;

    this._event = event;
    if (event.defaultPrevented) {
      this.preventDefault();
    }
  }
  
  public stopPropagation() {
    if (!this._event) throw new Error("BrowserEvent is undefined");

    super.stopPropagation();

    if (this._event.stopPropagation) {
      this._event.stopPropagation();
    } else {
      this._event.cancelBubble = true;
    }
  }
  
  public preventDefault() {
    if (!this._event) throw new Error("BrowserEvent is undefined");

    super.preventDefault();

    if (!this._event.preventDefault) {
      this._event.returnValue = false;
      try {
        // Most keys can be prevented using returnValue. Some special keys
        // require setting the keyCode to -1 as well:
        //
        // In IE7:
        // F3, F5, F10, F11, Ctrl+P, Crtl+O, Ctrl+F (these are taken from IE6)
        //
        // In IE8:
        // Ctrl+P, Crtl+O, Ctrl+F (F1-F12 cannot be stopped through the event)
        //
        // We therefore do this for all function keys as well as when Ctrl key
        // is pressed.
        const VK_F1 = 112;
        const VK_F12 = 123;
        const keyEvent = this._event as ISpecialKeyboardEvent;
        if (keyEvent.ctrlKey || keyEvent.keyCode >= VK_F1 && keyEvent.keyCode <= VK_F12) {
          keyEvent.keyCode = -1;
        }
      } catch (ex) {
        // IE throws an 'access denied' exception when trying to change
        // keyCode in some situations (e.g. srcElement is input[type=file],
        // or srcElement is an anchor tag rewritten by parent's innerHTML).
        // Do nothing in this case.
      }
    } else {
      this._event.preventDefault();
    }
  }

  public getBrowserEvent(): Event {
    if (!this._event) throw new Error("BrowserEvent is undefined");
    return this._event;
  }
}