export interface IAction {
  id: string;
  execute(): void;
}