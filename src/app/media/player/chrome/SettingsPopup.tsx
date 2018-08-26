import { Component, h } from 'preact';
import container, { ISettingsModuleFactorySymbol } from '../../../../config/inversify.config';
import { BrowserEvent } from '../../../libs/events/BrowserEvent';
import { EventHandler } from '../../../libs/events/EventHandler';
import { ISettingsFactory } from '../../../models/ISettingsFactory';
import { ISettingsModule } from '../../../models/ISettingsModule';
import { IPlayerApi } from '../IPlayerApi';

export interface IBaseMenuItem {
  label: string;
  disabled?: boolean;
  role: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
}

export interface IRadioMenuItem extends IBaseMenuItem {
  role: 'menuitemradio';
  selected: boolean;
  onselect?: () => void;
}

export interface ICheckboxMenuItem extends IBaseMenuItem {
  role: 'menuitemcheckbox';
  checked: boolean;

  onchange?: (checked: boolean) => void;
}

export interface ISubMenu extends IBaseMenuItem {
  role: 'menuitem';
  items: IMenuItem[];
  content: string;
}

export interface IRadioMenuGroup extends ISubMenu {
  items: IRadioMenuItem[];
}

export type IMenuItem =
  | IRadioMenuItem
  | ICheckboxMenuItem
  | ISubMenu
  | IRadioMenuGroup;

export type IMenu = IMenuItem[];

export interface IChromeSettingsPopupProps {
  api: IPlayerApi;
  maxHeight: number;
}

export interface IChromeSettingsPopupState {
  menu: IMenu;
}

const MainMenu = 'Main Menu';

function _renderMenuItemContent(menuItem: IMenuItem): JSX.Element | undefined {
  let content: JSX.Element | string | undefined;
  switch (menuItem.role) {
    case 'menuitemcheckbox':
      content = <div className="chrome-menuitem-toggle-checkbox" />;
      break;

    case 'menuitem':
      content = menuItem.content;
      break;

    default:
      return;
  }

  return <div className="chrome-menuitem-content">{content}</div>;
}

function _renderPanel(
  elems: Array<JSX.Element | undefined>,
  ref: (el?: Element) => void,
  level: number,
  title?: string,
  onreturn?: () => any
): JSX.Element {
  const onClick = () => onreturn && onreturn();

  return (
    <div
      className={`chrome-panel ${
        level > 0 ? 'chrome-panel-right' : 'chrome-panel-middle'
      }`}
      key={title || MainMenu}
      ref={ref}
      aria-level={level}
      aria-hidden={!!title}>
      {title && (
        <div className="chrome-panel-header">
          <button
            className="chrome-button chrome-panel-title"
            onClick={onClick}>
            {title}
          </button>
        </div>
      )}
      <div className="chrome-panel-menu" role="menu">
        {elems}
      </div>
    </div>
  );
}

function _renderMenuItem(
  menuItem: IMenuItem,
  onclick?: () => void
): JSX.Element {
  const hasPopup = menuItem.role === 'menuitem';
  const checked =
    (menuItem.role === 'menuitemradio' && menuItem.selected) ||
    (menuItem.role === 'menuitemcheckbox' && menuItem.checked);
  return (
    <div
      className="chrome-menuitem"
      role={menuItem.role}
      aria-disabled={menuItem.disabled}
      aria-haspopup={hasPopup}
      aria-checked={checked}
      onClick={menuItem.disabled ? undefined : onclick}>
      <div className="chrome-menuitem-label">{menuItem.label}</div>
      {_renderMenuItemContent(menuItem)}
    </div>
  );
}

function _renderMenu(
  menu: IMenuItem[],
  refFn: (name: string, el?: Element) => any,
  onnavigate: (menu?: string) => any,
  opts: { title?: string; onreturn?: () => any; level?: number } = {}
): JSX.Element[] {
  const subs: JSX.Element[] = [];
  if (!menu) {
    return subs;
  }

  const level = opts.level || 0;
  const items = menu.map(menuItem => {
    let onclick: () => any;
    switch (menuItem.role) {
      case 'menuitem':
        onclick = () => onnavigate(menuItem.label);
        subs.push(
          ..._renderMenu(menuItem.items, refFn, onnavigate, {
            title: menuItem.label,
            onreturn: () => onnavigate(opts.title),
            level: level + 1
          })
        );
        break;

      case 'menuitemradio':
        onclick = () => menuItem.onselect && menuItem.onselect();
        break;

      case 'menuitemcheckbox':
        onclick = () =>
          menuItem.onchange && menuItem.onchange(!menuItem.checked);
        break;

      default:
        console.error('unexpected menu item role', menuItem);
        return;
    }

    return _renderMenuItem(menuItem, onclick);
  });

  return [
    _renderPanel(
      items,
      (elem?: Element) => refFn(opts.title || MainMenu, elem),
      level,
      opts.title,
      opts.onreturn
    ),
    ...subs
  ];
}

export class ChromeSettingsPopup extends Component<
  IChromeSettingsPopupProps,
  IChromeSettingsPopupState
> {
  private _containerElement?: Element;
  private _menuElements: { [name: string]: Element | undefined } = {};

  private _handler = new EventHandler(this);

  private _currentMenu?: string;

  private _modules: ISettingsModule[];

  constructor(props: IChromeSettingsPopupProps) {
    super(props);
    
    const factory: ISettingsFactory = container.get(ISettingsModuleFactorySymbol);
    this._modules = factory(this.props.api);

    this.state = { menu: this._rebuildMenu() };
  }

  public componentDidMount() {
    if (!this._containerElement) return;

    for (const x of this._modules) {
      x.attachHandler();
      this._handler
        .listen(x, 'rebuild', () => this.setState({ menu: this._rebuildMenu() }))
        .listen(x, 'navigateToCurrent', () => this._onNavigate(this._currentMenu));
    }

    this._handler
      .listen(
        this.props.api,
        'settingsopen',
        () => this._onSettingsToggle(true),
        false
      )
      .listen(
        this.props.api,
        'settingsclose',
        () => this._onSettingsToggle(false),
        false
      )
      .listen(
        this.props.api,
        'resize',
        () => this._onNavigate(this._currentMenu),
        false
      );
  }

  public componentWillUnmount() {
    for (const module of this._modules) {
      module.detachHandler();
    }

    this._handler.removeAll();
  }

  public render(
    {  }: IChromeSettingsPopupProps,
    { menu }: IChromeSettingsPopupState
  ): JSX.Element {
    this._menuElements = {};

    const containerRef = (el?: Element) => (this._containerElement = el);
    const menuRefs = (name: string, el?: Element) =>
      (this._menuElements[name] = el);

    const onNavigate = (label?: string) => this._onNavigate(label);

    return (
      <div
        class="chrome-popup chrome-settings-menu"
        ref={containerRef}
        aria-hidden="true">
        {_renderMenu(menu, menuRefs, onNavigate)}
      </div>
    );
  }

  private _onSettingsToggle(open: boolean) {
    if (!this._containerElement) return;

    this._containerElement.setAttribute('aria-hidden', (!open).toString());

    // switch to main menu
    this._onNavigate();

    setImmediate(() => {
      if (open) {
        this._handler.listen(window, 'click', this._maybeClose, {
          passive: true
        });
      } else {
        this._handler.unlisten(window, 'click', this._maybeClose);
      }
    });
  }

  private _onNavigate(menu?: string) {
    if (!this._containerElement) return;

    const prevMenuElem = this._menuElements[this._currentMenu || MainMenu];
    if (prevMenuElem) prevMenuElem.setAttribute('aria-hidden', 'true');

    const targetMenuElem = this._menuElements[menu || MainMenu];
    if (!targetMenuElem) return;

    const targetLevel = parseInt(
      targetMenuElem.getAttribute('aria-level') || '0',
      10
    );
    Object.keys(this._menuElements).forEach((menuName: string) => {
      const menuElem = this._menuElements[menuName];
      if (!menuElem) return;

      const menuLevel = parseInt(
        menuElem.getAttribute('aria-level') || '0',
        10
      );
      if (menuLevel < targetLevel) {
        menuElem.className = 'chrome-panel chrome-panel-left';
      } else if (menuLevel > targetLevel) {
        menuElem.className = 'chrome-panel chrome-panel-right';
      } else {
        menuElem.className = 'chrome-panel chrome-panel-middle';
      }
    });

    const rect = targetMenuElem.getBoundingClientRect();
    this._containerElement.setAttribute(
      'style',
      `width:${rect.width}px;height:${Math.min(
        this.props.maxHeight,
        rect.height
      )}px;--max-popup-height:${this.props.maxHeight}px;`
    );

    targetMenuElem.setAttribute('aria-hidden', 'false');

    this._currentMenu = menu;
  }

  private _rebuildMenu(): IMenuItem[] {
    return this._modules.map(x => x.getMenuItem());
  }

  private _maybeClose(event: BrowserEvent) {
    if (this._shouldClose(event)) {
      this.props.api.closeSettings();
    }
  }

  private _shouldClose(event: BrowserEvent) {
    if (!this.props.api.isSettingsOpen()) return false;
    if (!this._containerElement) return false;

    let target = event.target as Node | null;
    while (target) {
      if (target.isEqualNode(this._containerElement)) return false;
      target = target.parentNode;
    }

    return true;
  }
}
