import { IActionKey } from "./IActionKey";
import { IAction } from "../libs/actions/IAction";
import { EventHandler } from "../libs/events/EventHandler";
import { Disposable } from "../libs/disposable/Disposable";
import { Event } from "../libs/events/Event";
import { BrowserEvent } from "../libs/events/BrowserEvent";

export class StaticActionController extends Disposable {
  private _keyMapping: {[key: string]: IActionKey[]} = {
    "seek_forward_85s": [{ key: 83 /* S */ }],
    "seek_start": [{ key: 36 /* HOME */ }, { key: 48 /* 0 */ }],
    "seek_10%": [{ key: 49 /* 1 */ }],
    "seek_20%": [{ key: 50 /* 2 */ }],
    "seek_30%": [{ key: 51 /* 3 */ }],
    "seek_40%": [{ key: 52 /* 4 */ }],
    "seek_50%": [{ key: 53 /* 5 */ }],
    "seek_60%": [{ key: 54 /* 6 */ }],
    "seek_70%": [{ key: 55 /* 7 */ }],
    "seek_80%": [{ key: 56 /* 8 */ }],
    "seek_90%": [{ key: 57 /* 9 */ }],
    "seek_end": [{ key: 35 /* END */ }],
    "seek_forward_5s": [{ key: 39 /* Arrow Right */ }],
    "seek_forward_10s": [{ key: 76 /* L */ }],
    "seek_backward_5s": [{ key: 37 /* Arrow Left */ }],
    "seek_backward_10s": [{ key: 74 /* J */ }],
    "volume_up": [{ key: 38 /* Arrow Up */ }],
    "volume_down": [{ key: 40 /* Arrow Down */ }],
    "toggle_fullscreen": [{ key: 70 /* F */ }, { key: 70 /* F */, global: true }],
    "mute_unmute": [{ key: 77 /* M */ }],
    "next_video": [{ key: 78 /* N */ , modifiers: { shift: true } }],
    "play_pause": [{ key: 32 /* SPACE */ }, { key: 75 /* K */ }, { key: 75 /* K */, global: true }]
  };

  private _baseElement: Element;

  private _actions: IAction[];
  private _handler?: EventHandler;

  constructor(base: Element, actions: IAction[]) {
    super();

    this._baseElement = base;
    this._actions = actions;
  }

  protected disposeInternal() {
    super.disposeInternal();

    if (this._handler) {
      this._handler.dispose();
    }
  }

  getKeyMappingById(id: string): IActionKey[] {
    if (!this._keyMapping.hasOwnProperty(id))
      return [];
    return this._keyMapping[id];
  }

  getHandler(): EventHandler {
    if (!this._handler) {
      this._handler = new EventHandler(this);
    }

    return this._handler;
  }

  protected _isKeyActive(mapping: IActionKey, e: BrowserEvent): boolean {
    if (e.keyCode !== mapping.key) return false;
      
    let ctrlKey = false;
    let shiftKey = false;
    let altKey = false;
    let metaKey = false;

    if (mapping.modifiers) {
      ctrlKey = !!mapping.modifiers.ctrl;
      shiftKey = !!mapping.modifiers.shift;
      altKey = !!mapping.modifiers.alt;
      metaKey = !!mapping.modifiers.meta;
    }
    if (e.ctrlKey !== ctrlKey) return false;
    if (e.shiftKey !== shiftKey) return false;
    if (e.altKey !== altKey) return false;
    if (e.metaKey !== metaKey) return false;

    return true;
  }

  protected _listenGlobal(action: IAction, mapping: IActionKey): void {
    const handler = this.getHandler();
    handler.listen(document, "keydown", (e: BrowserEvent) => {
      const element = e.target as HTMLElement;
      if (element) {
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA' || element.isContentEditable)
          return;
        if (this._baseElement.contains(element))
          return;
      }

      if (!this._isKeyActive(mapping, e)) return;

      action.execute();

      e.preventDefault();
    }, false);
  }

  protected _listenLocal(action: IAction, mapping: IActionKey): void {
    const handler = this.getHandler();
    handler.listen(this._baseElement, "keydown", (e: BrowserEvent) => {
      if (!this._isKeyActive(mapping, e)) return;

      action.execute();

      e.preventDefault();
    }, false);
  }

  enterDocument(): void {
    for (let i = 0; i < this._actions.length; i++) {
      let action = this._actions[i];

      let keyMappings = this.getKeyMappingById(action.id);
      for (let i = 0; i < keyMappings.length; i++) {
        if (keyMappings[i].global) {
          this._listenGlobal(action, keyMappings[i]);
        } else {
          this._listenLocal(action, keyMappings[i]);
        }
      }
    }
  }

  exitDocument(): void {
    if (this._handler) {
      this.getHandler().removeAll();
    }
  }
}