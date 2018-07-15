export interface IActionKey {
  key: number;
  modifiers?: {
    alt?: boolean;
    shift?: boolean;
    ctrl?: boolean;
    meta?: boolean;
  };
  global?: boolean;
}