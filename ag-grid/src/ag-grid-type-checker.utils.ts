import { FindOperator } from 'typeorm';
import { FilterType, GeneralFilters, Operators } from './ag-grid.enum';
import {
  DateFilterModel,
  FilterInput,
  FilterModel,
  CombinedSimpleModel,
  CombinedWhereModel,
  MultiColumnJoinOptions,
  NumberFilterModel,
  SetFilterModel,
  TextFilterModel,
} from './ag-grid.interface';
import { findOperatorTypes, WhereConditionType } from './ag-grid.type';

export function isFilterInputStrict(
  currentFilter:
    | FilterInput
    | FilterModel
    | CombinedSimpleModel
    | Operators
    | MultiColumnJoinOptions,
): currentFilter is FilterModel | CombinedSimpleModel {
  return !isMulticolumnJoinOptions(currentFilter) && !isOperator(currentFilter);
}

export function isFilterModel(
  filter:
    | FilterModel
    | CombinedSimpleModel
    | MultiColumnJoinOptions
    | Operators
    | undefined,
): filter is FilterModel {
  const casted = filter as FilterModel;
  return (
    isSetFilterModel(casted) ||
    (casted?.type !== undefined && casted.filterType !== undefined)
  );
}

export function isTextFilterModel(
  filter: FilterModel | CombinedSimpleModel,
): filter is TextFilterModel | CombinedSimpleModel {
  if (!filter) return false;

  if (isCombinedFilterModel(filter)) {
    return (
      isTextFilterModel(filter.condition1) &&
      isTextFilterModel(filter.condition2)
    );
  } else {
    return filter.filterType === FilterType.TEXT;
  }
}

export function isNumberFilterModel(
  filter: FilterModel | CombinedSimpleModel,
): filter is NumberFilterModel | CombinedSimpleModel {
  if (!filter) return false;

  if (isCombinedFilterModel(filter)) {
    return (
      isNumberFilterModel(filter.condition1) &&
      isNumberFilterModel(filter.condition2)
    );
  } else {
    return filter.filterType === FilterType.NUMBER;
  }
}

export function isSetFilterModel(
  filter: FilterModel,
): filter is SetFilterModel {
  if (!filter) return false;

  return filter.filterType === FilterType.SET;
}

export function isDateFilterModel(
  filter: FilterModel | CombinedSimpleModel,
): filter is DateFilterModel | CombinedSimpleModel {
  if (!filter) return false;

  if (isCombinedFilterModel(filter)) {
    return (
      isDateFilterModel(filter.condition1) &&
      isDateFilterModel(filter.condition2)
    );
  } else {
    return filter.filterType === FilterType.DATE;
  }
}

export function isCombinedFilterModel(
  filter:
    | FilterModel
    | CombinedSimpleModel
    | MultiColumnJoinOptions
    | Operators
    | undefined,
): filter is CombinedSimpleModel {
  const casted = filter as any;
  return (
    casted &&
    casted.operator !== undefined &&
    casted.condition1 !== undefined &&
    casted.condition2 !== undefined
  );
}

export function isCombinedWhereModel(
  filter: WhereConditionType,
): filter is CombinedWhereModel {
  const casted = filter as CombinedWhereModel;
  return (
    casted &&
    casted.operator !== undefined &&
    casted.filter_1 !== undefined &&
    casted.filter_2 !== undefined
  );
}

export function isMulticolumnJoinOptions(
  filter: any,
): filter is MultiColumnJoinOptions {
  return (
    filter &&
    (<MultiColumnJoinOptions>filter).multiColumnJoinOperator !== undefined
  );
}

export function isFindOperator<T = findOperatorTypes>(
  filter: any,
): filter is FindOperator<T> {
  const casted = filter as FindOperator<T>;
  return (
    casted &&
    casted.type !== undefined &&
    (casted.value !== undefined ||
      casted.child !== undefined ||
      casted.type.toLowerCase() === GeneralFilters.ISNULL.toLowerCase())
  );
}

export function isOperator(val: any): val is Operators {
  return Object.values(Operators).includes(
    typeof val === 'string' ? val.toUpperCase() : val,
  );
}
