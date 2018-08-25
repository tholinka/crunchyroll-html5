import { IAction } from './IAction';

export interface IActionable {
  getActions(): IAction[];
}
