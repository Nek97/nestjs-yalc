import { ArgsType, Field } from '@nestjs/graphql';
import { FilterInput } from './ag-grid.interface';
import {
  filterExpressionInputFactory,
  SortModelStrict,
  JoinArgOptions,
  SortModel,
  sortModelFactory,
} from './ag-grid.input';
import { FilterScalar } from './filter.scalar';
import returnValue from '@nestjs-yalc/utils/returnValue';
import { ClassType } from '@nestjs-yalc/types';
import { RowDefaultValues } from './ag-grid.enum';

export interface AgQueryParams<T = any> {
  [index: string]: any; // dynamic parameters
  startRow?: number;
  endRow?: number;
  sorting?: SortModelStrict<T>[];
  filters?: FilterInput;
  join?: { [index: string]: JoinArgOptions };
}

export const typeMap = new WeakMap();
export function agQueryParamsFactory(
  defaultValues?: AgQueryParams,
  entityModel?: ClassType,
): { new (): AgQueryParams } {
  const SortType = entityModel ? [sortModelFactory(entityModel)] : [SortModel];
  const FilterType = entityModel
    ? filterExpressionInputFactory(entityModel)
    : FilterScalar;

  @ArgsType()
  class AgQueryParams implements AgQueryParams {
    startRow: number = defaultValues?.startRow ?? RowDefaultValues.START_ROW;
    endRow: number = defaultValues?.endRow ?? RowDefaultValues.END_ROW;
    @Field(returnValue(SortType), {
      nullable: true,
      defaultValue: defaultValues?.sorting,
    })
    sorting?: typeof SortType;
    @Field(returnValue(FilterType), {
      nullable: true,
      defaultValue: defaultValues?.filters,
    })
    filters?: typeof FilterType;
  }

  typeMap.set(AgQueryParams, AgQueryParams);
  return typeMap.get(AgQueryParams);
}

export function agQueryParamsNoPaginationFactory(
  defaultValues?: AgQueryParams,
  entityModel?: ClassType,
): { new (): AgQueryParams } {
  const SortType = entityModel ? [sortModelFactory(entityModel)] : [SortModel];
  const FilterType = entityModel
    ? filterExpressionInputFactory(entityModel)
    : FilterScalar;

  @ArgsType()
  class AgQueryParams implements AgQueryParams {
    @Field(returnValue(SortType), {
      nullable: true,
      defaultValue: defaultValues?.sorting,
    })
    sorting?: typeof SortType;
    @Field(returnValue(FilterType), {
      nullable: true,
      defaultValue: defaultValues?.filters,
    })
    filters?: typeof FilterType;
  }

  typeMap.set(AgQueryParams, AgQueryParams);
  return typeMap.get(AgQueryParams);
}
