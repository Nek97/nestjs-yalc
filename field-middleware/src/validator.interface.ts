export enum DateCheckTypeEnum {
  MAX = 'max',
  MIN = 'min',
}

export interface Date {
  year: number;
  month: number;
  date: number;
}

export interface DateCheck {
  checkType: DateCheckTypeEnum;
  dateToAdd: Date;
}
export interface StringFormatMatchCheckOptions {
  toMatch: boolean;
  pattern: string;
}
