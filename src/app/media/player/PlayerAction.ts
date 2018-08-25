import { IAction } from '../../libs/actions/IAction';

export class PlayerAction implements IAction {
  public id: string;

  private _action: () => void;

  constructor(id: string, action: () => void) {
    this.id = id;
    this._action = action;
  }

  public execute() {
    this._action();
  }
}
