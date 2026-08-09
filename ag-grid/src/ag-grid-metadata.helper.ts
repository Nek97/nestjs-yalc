import {
    FieldMapper,
    isFieldMapper,
} from '@nestjs-yalc/interfaces/maps.interface';
import { ClassType } from '@nestjs-yalc/types';
import { ReturnTypeFuncValue } from '@nestjs/graphql';
import { getMetadataArgsStorage } from 'typeorm';
import { JoinColumnMetadataArgs } from 'typeorm/metadata-args/JoinColumnMetadataArgs';
import { RelationMetadataArgs } from 'typeorm/metadata-args/RelationMetadataArgs';
import { RelationInfo } from "./ag-grid-factory.helper";
import {
    AgGridFieldMetadata,
    DstExtended,
    FieldAndFilterMapper,
    getAgGridFieldMetadataList,
    getAgGridObjectMetadata,
    isDstExtended,
} from './object.decorator';

export const columnConversion = (
  key: string,
  data: FieldMapper | { [key: string]: AgGridFieldMetadata } | undefined,
): string => {
  if (data) {
    const dst = data[key]?.dst ?? key;
    return getDestinationFieldName(dst);
  }

  return key;
};

export const getFieldMapperSrcByDst = (
  data: FieldMapper | undefined,
  dst: string,
): string => {
  if (data) {
    for (const src of Object.keys(data)) {
      if (data[src].dst === dst) return src;
    }
  }

  return dst;
};

export const isSymbolic = (
  data: FieldMapper | undefined,
  key: string,
): boolean => {
  if (data && data[key]) {
    return data[key].isSymbolic ? true : false;
  } else {
    return false;
  }
};

export function getDestinationFieldName(dst: string | DstExtended): string {
  if (isDstExtended(dst)) {
    return dst.name;
  }

  return dst;
}

const objectToFieldMapperCache = new WeakMap();
export const objectToFieldMapper = (
  object:
    | FieldMapper
    | FieldAndFilterMapper
    | ReturnTypeFuncValue
    | ClassType,
): FieldAndFilterMapper => {
  if (typeof object !== 'symbol') {
    const cached = objectToFieldMapperCache.get(object as object);
    if (cached) {
      return cached;
    }
  }

  let fieldMapper: FieldAndFilterMapper = { field: {} };

  fieldMapper.extraInfo = {};

  const objectMetadata = getAgGridObjectMetadata(object as any);

  if (objectMetadata) {
    fieldMapper.filterOption = objectMetadata;

    const fieldMetadataList = getAgGridFieldMetadataList(object as any);

    if (fieldMetadataList) {
      for (const propertyName of Object.keys(fieldMetadataList)) {
        const fieldMetadata = fieldMetadataList[propertyName];
        const { src, dst, ...fieldMapperProperties } = fieldMetadata;
        if (src) {
          const newDst = dst ? getDestinationFieldName(dst) : src;

          fieldMapper.field[src] = {
            dst: newDst,
            ...fieldMapperProperties,
            _propertyName: propertyName,
          };

          const gqlType = fieldMetadata.gqlType?.();

          if (gqlType) {
            fieldMapper.extraInfo[src] = objectToFieldMapper(gqlType);
          }
        }
      }
    }
  } else if (isFieldMapper(object)) {
    fieldMapper.field = object;
  } else if (isIFieldAndFilterMapper(object as any)) {
    fieldMapper = object as FieldAndFilterMapper;
  } /**
  @todo rework or delete, it throws an error with enum as gqlType
  
  else if (Object.keys(object).length !== 0) {
    console.trace(object);
    throw new TypeError(
      `This object is not compatible with IFieldMapper ${JSON.stringify(
        object,
      )}`,
    );
  } */

  if (typeof object !== 'symbol')
    objectToFieldMapperCache.set(object as object, fieldMapper);

  return fieldMapper;
};

export function isIFieldAndFilterMapper(
  val: FieldMapper | FieldAndFilterMapper,
): val is FieldAndFilterMapper {
  return val?.field !== undefined;
}

export function getEntityRelations<Entity, DTO = Entity>(
  entityModel: ClassType<Entity>,
  dto?: ClassType<DTO>,
): RelationInfo[] {
  const relations = getMetadataArgsStorage().relations.filter(
    (v) =>
      typeof v.target !== 'string' &&
      (entityModel.prototype instanceof v.target || entityModel === v.target),
  );

  const joinColumns = getMetadataArgsStorage().joinColumns.filter(
    (v) =>
      typeof v.target !== 'string' &&
      (entityModel.prototype instanceof v.target || entityModel === v.target),
  );

  const agGridMetadata = getAgGridFieldMetadataList(dto ?? entityModel);

  return relations.map((r: RelationMetadataArgs) => ({
    relation: r,
    join: joinColumns.find(
      (j: JoinColumnMetadataArgs) => j.propertyName === r.propertyName,
    ),
    agField: agGridMetadata
      ? Object.values(agGridMetadata).find((v) => v.dst === r.propertyName)
      : { _propertyName: r.propertyName },
  }));
}

export function getTypeProperties<Entity>(entityModel: ClassType<Entity>) {
  const columns = getMetadataArgsStorage().columns.filter(
    (v) =>
      typeof v.target !== 'string' &&
      (entityModel.prototype instanceof v.target || entityModel === v.target),
  );

  // to get ag-grid fields
  const fieldMetadataList = getAgGridFieldMetadataList(entityModel);

  if (fieldMetadataList) {
    for (const propertyName of Object.keys(fieldMetadataList)) {
      const fieldMetadata = fieldMetadataList[propertyName];

      if (fieldMetadata.mode !== 'derived') {
        // skip non virtual columns
        continue;
      }

      columns.push({
        propertyName,
        target: entityModel,
        mode: 'regular',
        options: {},
      });
    }
  }

  return columns;
}

export function getMappedTypeProperties<Entity>(
  entityModel: ClassType<Entity>,
) {
  const fieldMapper = objectToFieldMapper(entityModel);

  return getTypeProperties(entityModel).reduce((r, v) => {
    const src = getFieldMapperSrcByDst(fieldMapper.field, v.propertyName);

    if (!fieldMapper.field[src]?.denyFilter) r.push(src);
    return r;
  }, new Array<string>());
}
