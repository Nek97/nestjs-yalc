import { QueryBuilderHelper } from '@nestjs-yalc/database/query-builder.helper';
import {
    FieldMapper
} from '@nestjs-yalc/interfaces/maps.interface';

import { GraphQLResolveInfo } from 'graphql';
import { Equal, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { createWhere, getFindOperator } from './ag-grid-args.decorator';
import { columnConversion, objectToFieldMapper } from "./ag-grid-metadata.helper";
import {
    isCombinedWhereModel,
    isFindOperator,
} from './ag-grid-type-checker.utils';
import { FilterType, Operators } from './ag-grid.enum';
import {
    AgGridConditionNotSupportedError,
    AgGridNotPossibleError,
    AgGridStringWhereError,
} from './ag-grid.error';
import { JoinArgOptions, JoinTypes } from './ag-grid.input';
import {
    AgGridFindManyOptions,
    ExtraArg,
    FilterInput,
} from './ag-grid.interface';
import {
    FilterArg,
    findOperatorTypes,
    WhereCondition,
    WhereConditionType,
    WhereFilters,
} from './ag-grid.type';

import {
    AgGridFieldMetadata,
    FieldAndFilterMapper
} from './object.decorator';

export const forceFilters = (
  where: WhereCondition | string | undefined,
  properties: FilterArg[],
  fieldMap: FieldMapper | undefined,
): WhereCondition => {
  // typeORM where property can be a string as type but we do not allow to use
  // string with this filter. Should never happen though
  if (typeof where === 'string') {
    throw new AgGridStringWhereError();
  }
  for (const property of properties) {
    if (property.value) {
      where = forceFilterWorker(
        where,
        columnConversion(property.key, fieldMap),
        property.value,
        property.descriptors,
      );
    }
  }

  if (where) {
    return where;
  } else {
    throw new AgGridNotPossibleError();
  }
};

export const forceFilterWorker = (
  where: WhereCondition | undefined,
  target: string,
  value: findOperatorTypes,
  descriptors?: ExtraArg,
): WhereCondition => {
  const filter = descriptors
    ? getFindOperator(
        descriptors.filterType,
        descriptors.filterCondition,
        value,
      )
    : Equal(value);

  if (where && where.filters) {
    where.filters[target] = filter;
  } else {
    where = { filters: {} };
    where.filters[target] = filter;
  }

  return where;
};

export function whereObjectToSqlString<Entity extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<Entity> | undefined,
  where: WhereCondition,
  alias?: string,
  fieldMap?: {
    parent: FieldMapper;
    joined: FieldMapper | { [key: string]: FieldMapper };
  },
) {
  let sql = '';

  const operator = (where.operator ?? Operators.AND).toUpperCase(); // first level is always AND

  if (Array.isArray(where.childExpressions)) {
    where.childExpressions.forEach((childExpression) => {
      const generatedSql = whereObjectToSqlString(
        queryBuilder,
        childExpression,
        alias,
      );

      if (!generatedSql) return;

      sql += `(${generatedSql}) ${operator} `;
    });
  }

  if (!where.filters) return sql;

  for (const key of Object.keys(where.filters)) {
    const operation: WhereConditionType = where.filters[key];

    //If we have an operator it means that the filter is combined, or it is a multicolumn
    if ((operation as any).operator !== undefined) {
      //If it is a multicolumn then we convert all internal filters to the multicolumn and enclose the result in round brackets
      if (
        isCombinedWhereModel(operation) &&
        !isCombinedWhereModel(operation.filter_1) &&
        !isCombinedWhereModel(operation.filter_2)
      ) {
        //If instead it is a combined filter then we will convert the first and second filters, enclosing them in brackets and using the operator
        sql += `(${QueryBuilderHelper.computeFindOperatorExpression(
          queryBuilder as any,
          operation.filter_1,
          QueryBuilderHelper.addAlias(key.toString(), alias, fieldMap),
          operation.filter_1.value,
        )} ${operation.operator.toUpperCase()} ${QueryBuilderHelper.computeFindOperatorExpression(
          queryBuilder as any,
          operation.filter_2,
          QueryBuilderHelper.addAlias(key.toString(), alias, fieldMap),
          operation.filter_2.value,
        )}) ${operator} `;
      } else {
        /**
         * @todo handle the else (?) but it should not happen
         */
        throw new AgGridConditionNotSupportedError();
      }
    } else if (isFindOperator(operation)) {
      //If it is a normal filter then we simply convert it and add the operator
      sql += `${QueryBuilderHelper.computeFindOperatorExpression(
        queryBuilder as any,
        operation,
        QueryBuilderHelper.addAlias(key.toString(), alias, fieldMap),
        operation.value,
      )} ${operator} `;
    } else if (typeof operation === 'string') {
      sql += `${QueryBuilderHelper.addAlias(
        key.toString(),
        alias,
        fieldMap,
      )} ${operation} ${operator}`;
    } else {
      throw new AgGridConditionNotSupportedError(JSON.stringify(operation));
    }
  }
  //At the end of the cycle we will have an operator and an excess space, and we remove them
  sql = sql.substring(0, sql.lastIndexOf(operator));
  sql = sql.substring(0, sql.lastIndexOf(' '));
  return sql;
}

export const isAskingForCount = (info: GraphQLResolveInfo): boolean => {
  try {
    return (
      info.fieldNodes?.[0].selectionSet?.selections.some((item: any) => {
        return (
          item.name.value === 'pageData' &&
          item.selectionSet &&
          item.selectionSet.selections.some(
            (subItem: any) => subItem.name.value === 'count',
          )
        );
      }) ?? false
    );
  } catch (e) {
    // quick way to avoid having dozens of conditions to check the info structure
    return false;
  }
};

export function filterTypeToNativeType(type: FilterType) {
  switch (type) {
    case FilterType.TEXT:
      return String;
    case FilterType.DATE:
      return Date;
    case FilterType.NUMBER:
      return Number;
    case FilterType.SET:
      return Array;
  }

  throw new TypeError(
    `Filter type not supported for native conversion: ${type}`,
  );
}

export function applyJoinArguments(
  findManyOptions: AgGridFindManyOptions,
  alias: string,
  join: { [index: string]: JoinArgOptions },
  fieldMapper: { [key: string]: AgGridFieldMetadata },
): void {
  const _joinObject: {
    alias: string;
    innerJoinAndSelect: { [key: string]: string };
    leftJoinAndSelect: { [key: string]: string };
  } = {
    alias,
    innerJoinAndSelect: {},
    leftJoinAndSelect: {},
  };

  Object.keys(join).forEach((table: string) => {
    const j: JoinArgOptions = join[table];
    switch (j.joinType) {
      case JoinTypes.INNER_JOIN:
        _joinObject.innerJoinAndSelect[table] = `${_joinObject.alias}.${table}`;
        break;
      case JoinTypes.LEFT_JOIN:
      default:
        _joinObject.leftJoinAndSelect[table] = `${_joinObject.alias}.${table}`;
        break;
    }

    const type = fieldMapper[table].gqlType?.();
    const _fieldMapper: FieldAndFilterMapper = type
      ? objectToFieldMapper(type)
      : { field: {} };

    if (j.filters) {
      findManyOptions.where = createWhere(
        j.filters,
        _fieldMapper.field,
        table,
        findManyOptions.where,
      );
    }
  });

  findManyOptions.join = _joinObject;

  findManyOptions.extra = {
    ...findManyOptions.extra,
    _aliasType: _joinObject.alias,
  };
}

export function isFilterExpressionInput(
  filterInput: any,
): filterInput is FilterInput {
  const casted = filterInput as FilterInput;
  return !!casted.expressions;
}

export function traverseFiltersAndApplyFunction(
  where: WhereCondition,
  callback: { (value: WhereFilters, key: string): void },
): void {
  const filters: WhereFilters = where.filters;

  for (const filter in filters) {
    callback(filters, filter);
  }

  if (Array.isArray(where.childExpressions)) {
    where.childExpressions.map((expr) =>
      traverseFiltersAndApplyFunction(expr, callback),
    );
  }
}

export function formatRawSelection(
  selection: string,
  fieldName: string,
  /* istanbul ignore next */
  prefix = '',
  onlyAlias = false,
): string {
  let aliasPrefix = '';
  let _prefix = '';
  if (prefix) {
    aliasPrefix = prefix + '_';
    _prefix = prefix + `.`;
  }

  const alias = `${aliasPrefix}${fieldName}`;

  if (onlyAlias) return alias;

  selection = `${_prefix}${selection} AS \`${alias}\``;

  return selection;
}

/**
 * Derived fields need metadata attached in order to be processed by
 * the AgGrid Repository. Use this method to apply the proper
 * selection with metadata to a find option object
 */
export function applySelectOnFind<T = any>(
  findOptions: AgGridFindManyOptions,
  field: keyof T,
  fieldMapper: { [key: string]: AgGridFieldMetadata },
  alias = '',
  /**
   * If it's a nested field, you need to specify a path
   */
  path = '',
) {
  if (path && !path.endsWith('.')) path = path + '.';

  const fieldName = field.toString();
  const dst = columnConversion(fieldName, fieldMapper).toString();

  const key = path + dst;

  if (!findOptions.extra) {
    findOptions.extra = { _keysMeta: {} };
  }

  if (fieldMapper[fieldName]?.mode === 'derived' || path) {
    const keysMeta = findOptions.extra._keysMeta ?? {};

    // do not apply twice
    if (keysMeta[key]) return;

    keysMeta[key] = {
      fieldMapper: fieldMapper[fieldName],
      isNested: !!path,
      rawSelect: formatRawSelection(dst, fieldName, alias),
    };

    findOptions.extra._keysMeta = keysMeta;
  } else {
    const selection = (findOptions.select as any[]) ?? [];

    selection.push(key);

    findOptions.select = selection as any;
  }
}
