import { ObjectType, Field, HideField } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import { FindManyOptions, FindOperator } from 'typeorm';
import returnValue from '@nestjs-yalc/utils/returnValue';
import { ExtraArg, CombinedWhereModel } from './ag-grid.interface';
import { Operators } from './ag-grid.enum';

@ObjectType()
export class PageDataAgGrid {
  @Field()
  public count!: number;

  @Field()
  public startRow!: number;

  @Field()
  public endRow!: number;
}

export interface Connection {
  name: string;
  nodes: unknown[];
  pageData: PageDataAgGrid;
}

export const typeMap: {
  [key: string]: { new (name: string): Connection };
} = {};
export default function AgGridGqlType<T>(type: Type<T>): unknown {
  const { name } = type;
  if (typeMap[`${name}`]) return typeMap[`${name}`];

  @ObjectType(`${name}Connection`, { isAbstract: true })
  class Connection implements Connection {
    @HideField() // internally used
    public name = `${name}Connection`;

    @Field(returnValue([type]), { nullable: true })
    public nodes!: T[];
    @Field(returnValue(PageDataAgGrid), { nullable: true })
    public pageData!: PageDataAgGrid;
  }
  typeMap[`${name}`] = Connection;

  return typeMap[`${name}`];
}

export type findOperatorTypes = string | number | Date | undefined | null;

export interface GqlSelectedFields<T> {
  fields: (keyof T)[];
}

export interface AgGridArgs<T>
  extends FindManyOptions,
    GqlSelectedFields<T> {}

export interface RecursiveFindOperator<T> {
  [index: number]: RecursiveFindOperator<T> | FindOperator<T>;
  length: number;
}

export interface RecursiveAndFindOperator<T> {
  condition_1?: RecursiveAndFindOperator<T> | FindOperator<T>;
  condition_2?: RecursiveAndFindOperator<T> | FindOperator<T>;
}

export type WhereConditionType =
  | FindOperator<findOperatorTypes>
  | FindOperator<findOperatorTypes>[]
  | RecursiveFindOperator<findOperatorTypes>
  | RecursiveFindOperator<findOperatorTypes>[]
  | RecursiveAndFindOperator<findOperatorTypes>
  | RecursiveAndFindOperator<findOperatorTypes>[]
  | CombinedWhereModel;

export type WhereFilters = {
  [key: string]: WhereConditionType;
};

export interface WhereCondition {
  operator?: Operators;
  filters: WhereFilters;
  childExpressions?: WhereCondition[];
}

export interface FilterArg {
  key: string;
  value: findOperatorTypes;
  descriptors?: ExtraArg;
}

export interface Select {
  field: string;
  isRaw?: boolean;
  isNested?: boolean;
}
