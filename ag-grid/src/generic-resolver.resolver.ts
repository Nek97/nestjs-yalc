export * from './generic-mutation.resolver';
export * from './generic-query.resolver';
export * from './generic-resolver.type';
import {
    Resolver
} from '@nestjs/graphql';

import {
    GenericService,
    getServiceToken,
} from '@nestjs-yalc/ag-grid/generic-service.service';
import {
    getDataloaderToken,
    GQLDataLoader,
} from '@nestjs-yalc/data-loader/dataloader.helper';
import returnValue from '@nestjs-yalc/utils/returnValue';
import {
    Inject
} from '@nestjs/common';
import { ContextId, ContextIdFactory, ModuleRef } from '@nestjs/core';
import { ObjectLiteral } from 'typeorm';
import { RelationInfo } from "./ag-grid-factory.helper";
import { getEntityRelations } from "./ag-grid-metadata.helper";
import { defineCreateMutation, defineDeleteMutation, defineUpdateMutation } from "./generic-mutation.resolver";
import { defineFieldResolver, defineGetGridResource, defineGetSingleResource } from "./generic-query.resolver";
import { GenericResolver, GenericResolverOptions, isCustomSingleQueryOptions } from "./generic-resolver.type";
import { getAgGridFieldMetadataList } from './object.decorator';

// export interface ICustomQueryOptions extends IGenericResolverMethodOptions {
//   /**
//    * Filters with direct arguments
//    */
//   extraArgsStrategy?: ExtraArgsStrategy;
//   extraArgs?: {
//     [index: string]: IExtraArg;
//   };
// }

export function resolverFactory<
  Entity extends Record<string, any> = any,
  EntityWrite extends ObjectLiteral = Entity,
>(
  options: GenericResolverOptions<Entity>,
): {
  new (
    service: GenericService<Entity, EntityWrite>,
    dataloader: GQLDataLoader<Entity>,
    moduleRef: ModuleRef,
  ): GenericResolver;
} {
  const returnType = options.dto ?? options.entityModel;

  @Resolver(returnValue(returnType), { isAbstract: true })
  abstract class BaseClass {
    [index: string]: any; //index signature to allow dynamic properties

    contextId: ContextId;

    constructor(
      @Inject(
        options.service?.serviceToken ?? getServiceToken(options.entityModel),
      )
      protected service: GenericService<Entity, EntityWrite>,
      @Inject(
        options.service?.dataLoaderToken ??
          getDataloaderToken(options.entityModel),
      )
      protected dataLoader: GQLDataLoader<Entity>,
      protected moduleRef: ModuleRef,
    ) {
      this.contextId = ContextIdFactory.create();
      this.moduleRef;
    }
  }

  /**
   *
   * Retrieve information about relations
   *
   */
  const resolverInfoList: RelationInfo[] = getEntityRelations(
    options.entityModel,
    options.dto,
  );

  const fieldMetadataList = getAgGridFieldMetadataList(returnType);
  if (fieldMetadataList) {
    Object.keys(fieldMetadataList).forEach((propertyName) => {
      const field = fieldMetadataList[propertyName];
      if (!field.relation) return;

      const objIndex = resolverInfoList.findIndex((obj) => {
        if (obj.join) {
          return obj.join.propertyName === propertyName;
        } else {
          return;
        }
      });

      // if already exists override (dataloader options take priority)
      if (objIndex >= 0) {
        const relInfo = resolverInfoList[objIndex];

        const target = field.relation.targetKey.alias;

        resolverInfoList[objIndex] = {
          ...relInfo,
          join: {
            ...relInfo.join,
            propertyName,
            name: field.relation.sourceKey.alias,
            target,
            referencedColumnName: target,
          },
          relation: {
            ...relInfo.relation,
            propertyName,
            relationType: field.relation.relationType,
            type: field.relation.type,
            target: options.entityModel,
          },
          agField: {
            ...relInfo.agField,
            ...field,
          },
        };
      } else {
        const target = field.relation.targetKey.alias;

        const dataLoaderRelation: RelationInfo = {
          join: {
            propertyName,
            name: field.relation.sourceKey.alias,
            target,
            referencedColumnName: target,
          },
          relation: {
            propertyName,
            relationType: field.relation.relationType,
            type: field.relation.type,
            isLazy: true,
            target: options.entityModel,
            options: {},
          },
          agField: field,
        };
        resolverInfoList.push(dataLoaderRelation);
      }
    });
  }

  /**
   *
   * Generate Mutations
   *
   */
  const createOptions = options.mutations?.createResource ?? {};
  const updateOptions = options.mutations?.updateResource ?? {};
  const deleteOptions = options.mutations?.deleteResource ?? {};

  @Resolver(returnValue(returnType), {
    isAbstract: true,
  })
  class Mutations extends BaseClass {}

  defineCreateMutation(
    `${options.prefix ?? ''}create${options.entityModel.name}`,
    returnType,
    Mutations,
    options,
    createOptions,
  );

  defineUpdateMutation(
    `${options.prefix ?? ''}update${options.entityModel.name}`,
    returnType,
    Mutations,
    options,
    updateOptions,
  );

  defineDeleteMutation(
    `${options.prefix ?? ''}delete${options.entityModel.name}`,
    returnType,
    Mutations,
    options,
    deleteOptions,
  );

  const getResourceOptions = options.queries?.getResource ?? {};
  const getResourceGridOptions = options.queries?.getResourceGrid ?? {};

  /**
   *
   * Generate Queries
   *
   */
  @Resolver(returnValue(returnType))
  class GenericResolver
    extends (options.readonly ? BaseClass : Mutations)
    implements GenericResolver {}

  defineGetSingleResource(
    `${options.prefix ?? ''}get${options.entityModel.name}`,
    returnType,
    GenericResolver,
    getResourceOptions,
  );

  defineGetGridResource(
    `${options.prefix ?? ''}get${options.entityModel.name}Grid`,
    returnType,
    GenericResolver,
    getResourceGridOptions,
  );

  /**
   *
   * Generate Field Resolvers
   *
   */

  defineFieldResolver(resolverInfoList, GenericResolver);
  /**
   *
   * Generate dynamic queries
   *
   */

  if (options.customQueries) {
    for (const methodName of Object.keys(options.customQueries)) {
      const queryName = methodName;
      const queryOptions = options.customQueries[methodName];

      if (isCustomSingleQueryOptions(queryOptions)) {
        defineGetSingleResource(
          queryName,
          returnType,
          GenericResolver,
          queryOptions,
        );
      } else {
        defineGetGridResource(
          queryName,
          returnType,
          GenericResolver,
          queryOptions,
        );
      }
    }
  }

  return GenericResolver;
}
