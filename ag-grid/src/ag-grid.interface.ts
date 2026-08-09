/* istanbul ignore file */

import { FieldMapper } from '@nestjs-yalc/interfaces/maps.interface';
import { ClassType } from '@nestjs-yalc/types';
import {
  ArgsOptions,
  GqlExecutionContext,
  ReturnTypeFuncValue,
} from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { FindManyOptions, FindOperator } from 'typeorm';
import { AgQueryParams } from './ag-grid.args';
import {
  ExtraArgsStrategy,
  FilterType,
  GeneralFilters,
  Operators,
} from './ag-grid.enum';
import { WhereCondition } from './ag-grid.type';
import type { KeyMeta } from './gqlfields.decorator';
import { FieldAndFilterMapper } from './object.decorator';

export interface BaseFilterModel {
  filterType: FilterType;
  field: string;
}

export interface SimpleFilterModel extends BaseFilterModel {
  type: GeneralFilters;

  filter?: string | number;
}

export interface TextFilterModel extends SimpleFilterModel {
  // always 'text' for text filter
  filterType: FilterType.TEXT;

  // one of the filter options, e.g. 'equals'
  type: GeneralFilters;

  // the text value associated with the filter.
  // it's optional as custom filters may not
  // have a text value
  filter?: string;
}

export interface SetFilterModel extends BaseFilterModel {
  filterType: FilterType.SET;

  values: (string | number)[];
}

export interface NumberFilterModel extends SimpleFilterModel {
  // always 'number' for number filter
  filterType: FilterType.NUMBER;

  // one of the filter options, e.g. 'equals'
  type: GeneralFilters;

  // the number value(s) associated with the filter.
  // custom filters can have no values (hence both are optional).
  // range filter has two values (from and to).
  filter?: number;
  filterTo?: number;
}

export interface DateFilterModel extends SimpleFilterModel {
  // always 'date' for date filter
  filterType: FilterType.DATE;

  // one of the filter options, e.g. 'equals'
  type: GeneralFilters;

  // the date value(s) associated with the filter.
  // the type is string and format is always YYYY-MM-DD e.g. 2019-05-24
  // custom filters can have no values (hence both are optional).
  // range filter has two values (from and to).
  dateFrom?: string;
  dateTo?: string;
}

export type GenericFilterModel =
  | SimpleFilterModel
  | TextFilterModel
  | NumberFilterModel;

export type FilterModel =
  | GenericFilterModel
  | DateFilterModel
  | SetFilterModel;

export interface CombinedSimpleModel {
  // the filter type: date, number or text
  filterType: FilterType;

  operator: Operators;

  // two instances of the filter model
  condition1: FilterModel;
  condition2: FilterModel;
}

export type FilterInputStrict = (FilterModel | CombinedSimpleModel)[];

export interface MultiColumnProperty {
  multiColumnJoinOptions?: MultiColumnJoinOptions;
}

export interface MultiColumnObject extends MultiColumnProperty {
  multiColumnJoinOperator: Operators;
}

/**
 * @deprecated
 */
export type FilterInputOld = {
  [key: string]:
    | FilterModel
    | CombinedSimpleModel
    | MultiColumnJoinOptions
    | undefined;
} & MultiColumnProperty;

export interface TextFilter {
  [FilterType.TEXT]: TextFilterModel;
}

export interface NumberFilter {
  [FilterType.NUMBER]: NumberFilterModel;
}

export interface DateFilter {
  [FilterType.DATE]: DateFilterModel;
}

export interface SetFilter {
  [FilterType.SET]: SetFilterModel;
}

// we should consider to implement the @oneOf
// when it will be available: https://github.com/graphql/graphql-spec/pull/825
export interface FilterExpressionsProperty {
  [FilterType.TEXT]?: TextFilterModel;
  [FilterType.NUMBER]?: NumberFilterModel;
  [FilterType.DATE]?: DateFilterModel;
  [FilterType.SET]?: SetFilterModel;
  [FilterType.MULTI]?: never;
}

export type FilterExpressionType =
  | TextFilter
  | NumberFilter
  | DateFilter
  | SetFilter;

export interface FilterInput {
  operator?: Operators;
  expressions?: FilterExpressionsProperty[];
  childExpressions?: FilterInput[];
}

export interface AgGridFindExtraOptions {
  /** It apply limit and offset at the same level of the join instead of
   * wrapping the join with another query by applying the limit later
   */
  rawLimit?: boolean;
  /*
   * skip count in getter functions that include the counter
   * value. It will return -1 instead. Useful to avoid not needed
   * count operation, for instance: when the user is not asking the field
   */
  skipCount?: boolean;

  /**
   * Extra args
   */
  args?: {
    [index: string]: unknown;
  };

  /**
   * Internally used
   */
  _fieldMapper?: FieldMapper;
  _keysMeta?: { [key: string]: KeyMeta };
  _aliasType?: string;
}

export interface AgGridFindManyOptions<T = unknown> extends Omit<FindManyOptions<T>, 'where'> {
  where?: WhereCondition;
  /** Contains useful information about the graphql request */
  info?: GraphQLResolveInfo;
  extra?: AgGridFindExtraOptions;
  subQueryFilters?: AgGridFindManyOptions<T>;
}

export type MultiColumnJoinOptions = {
  [key: string]:
    | FilterModel
    | CombinedSimpleModel
    | MultiColumnJoinOptions
    | Operators
    | undefined;
} & MultiColumnObject;

export interface CombinedWhereModel {
  operator: Operators;
  // two instances of the filter model
  filter_1: FindOperator<string | number | Date | null> | CombinedWhereModel;
  filter_2: FindOperator<string | number | Date | null> | CombinedWhereModel;
}

export interface BaseArg {
  /**
   *
   */
  filterMiddleware?: { (ctx: GqlExecutionContext, filterValue?: unknown): unknown };
  /**
   *
   */
  hidden?: boolean;
}

export interface DArg extends BaseArg {
  name: string;
}

export interface ExtraArg extends BaseArg {
  options?: ArgsOptions;
  filterType: FilterType;
  filterCondition: GeneralFilters;
}

export interface AgGridArgsSingleOptions {
  /**
   * @property Options for the nestjs Args decorator
   */
  gql?: ArgsOptions;
  /**
   * @deprecated use fieldType instead
   * @property fieldMap is used internally to convert names of exposed fields to database fields
   */
  fieldMap?: FieldMapper | FieldAndFilterMapper;
  /**
   * @property fieldType is used internally to retrieve information about the returned type
   */
  fieldType?: ClassType | ReturnTypeFuncValue;
  /**
   * @property entityType is used internally to generate graphql types for the inputs
   */
  entityType?: ClassType;
}

export interface AgGridArgsOptions extends AgGridArgsSingleOptions {
  defaultValue?: AgQueryParams;
  /**
   * Filters with direct arguments
   */
  extraArgsStrategy?: ExtraArgsStrategy;
  extraArgs?: {
    [index: string]: ExtraArg;
  };
  options?: {
    maxRow: number;
  };
}
