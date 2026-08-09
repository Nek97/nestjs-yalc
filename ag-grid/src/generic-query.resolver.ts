import { GQLDataLoader, getDataloaderToken } from "@nestjs-yalc/data-loader/dataloader.helper";
import { ClassType } from "@nestjs-yalc/types";
import { isClass } from "@nestjs-yalc/utils/class.helper";
import { GetContext } from "@nestjs-yalc/utils/nest.decorator";
import returnValue from "@nestjs-yalc/utils/returnValue";
import { UseInterceptors, ExecutionContext, applyDecorators, Query } from "@nestjs/common";
import { ResolveField, Parent, GqlExecutionContext, Args } from "@nestjs/graphql";
import { AgGridArgs, AgGridArgsSingle } from "./ag-grid-args.decorator";
import { RelationInfo } from "./ag-grid-factory.helper";
import { filterTypeToNativeType } from "./ag-grid-query.helper";
import { AgGridError } from "./ag-grid.error";
import { AgGridInterceptor } from "./ag-grid.interceptor";
import { AgGridFindManyOptions } from "./ag-grid.interface";
import AgGridGqlType from "./ag-grid.type";
import { GenericResolver, hasFilters, GenericResolverQueryOptions, isIDArg, checkFinalId, generateDecorators, hasExtraArgs } from "./generic-resolver.type";

export function defineFieldResolver<Entity extends Record<string, any> = any>(
  resolverInfoList: RelationInfo[],
  resolver: ClassType<GenericResolver>,
) {
  for (const resolverInfo of resolverInfoList) {
    let relType =
      (typeof resolverInfo.relation.type === 'function'
        ? (resolverInfo.relation.type as Function)()
        : resolverInfo.relation.type) ?? resolverInfo.agField?.gqlType?.();

    if (Array.isArray(relType)) {
      relType = relType[0];
    } else if (!relType) {
      throw new AgGridError('relation type undefined');
    }

    if (
      resolverInfo.relation.relationType === 'one-to-many' ||
      resolverInfo.relation.relationType === 'many-to-many'
    ) {
      Object.defineProperty(
        resolver.prototype,
        resolverInfo.relation.propertyName,
        {
          configurable: true,
          enumerable: true,
          writable: true,
          value: async function (
            parent: Entity,
            findOptions: AgGridFindManyOptions,
          ): Promise<[Array<Entity | null>, number]> {
            const parentRes = parent[resolverInfo.relation.propertyName];

            if (parentRes !== undefined) {
              if (hasFilters(findOptions))
                throw new AgGridError(
                  'Cannot specify join arguments and resolver arguments at the same time',
                );

              return [parentRes, -1];
            }

            const dataLoader: GQLDataLoader<Entity> =
              await this.moduleRef.resolve(
                getDataloaderToken(relType),
                this.contextId,
              );

            const joinCol =
              resolverInfo.join?.referencedColumnName ??
              dataLoader.getSearchKey();

            const parentCol =
              resolverInfo.join?.name ?? dataLoader.getSearchKey();

            return dataLoader.loadOneToMany(
              [joinCol, parent[parentCol]],
              findOptions,
              true,
            );
          },
        },
      );

      const descriptor = Object.getOwnPropertyDescriptor(
        resolver.prototype,
        resolverInfo.relation.propertyName,
      );

      if (!descriptor)
        throw new ReferenceError(
          `GenericResolver.${resolverInfo.relation.propertyName} must have a descriptor`,
        );

      ResolveField(returnValue(AgGridGqlType<Entity>(relType)), {
        nullable: resolverInfo.agField?.gqlOptions?.nullable,
      })(resolver.prototype, resolverInfo.relation.propertyName, descriptor);
      UseInterceptors(new AgGridInterceptor())(
        resolver.prototype,
        resolverInfo.relation.propertyName,
        descriptor,
      );

      Parent()(resolver.prototype, resolverInfo.relation.propertyName, 0);

      AgGridArgs({
        fieldType: relType,
        entityType: relType,
        defaultValue: resolverInfo.agField?.relation?.defaultValue,
      })(resolver.prototype, resolverInfo.relation.propertyName, 1);

      // without the design:paramtypes metadata
      // it won't work, the following instruction is transpiled and generated
      // when the decorators are defined in their standard way.
      Reflect.metadata('design:paramtypes', [Object, Object])(
        resolver.prototype,
        resolverInfo.relation.propertyName,
      );
    } else {
      /**
       * ONE-TO-ONE Resolve Fields
       */

      Object.defineProperty(
        resolver.prototype,
        resolverInfo.relation.propertyName,
        {
          configurable: true,
          enumerable: true,
          writable: true,
          value: async function (
            parent: Entity,
            findOptions: AgGridFindManyOptions,
          ): Promise<Entity | null> {
            const parentRes = parent[resolverInfo.relation.propertyName];

            if (parentRes !== undefined) {
              if (hasFilters(findOptions))
                throw new AgGridError(
                  'Cannot specify join arguments and resolver arguments at the same time',
                );

              return parentRes;
            }

            const dataLoader: GQLDataLoader<Entity> =
              await this.moduleRef.resolve(
                getDataloaderToken(relType),
                this.contextId,
              );

            /* istanbul ignore next */
            const joinCol =
              resolverInfo.join?.referencedColumnName ??
              dataLoader.getSearchKey();

            const parentCol =
              resolverInfo.join?.name ?? dataLoader.getSearchKey();
            return dataLoader.loadOne(
              [joinCol, parent[parentCol]],
              findOptions,
              false,
            );
          },
        },
      );

      const descriptor = Object.getOwnPropertyDescriptor(
        resolver.prototype,
        resolverInfo.relation.propertyName,
      );

      if (!descriptor)
        throw new ReferenceError(
          `GenericResolver.${resolverInfo.relation.propertyName} must have a descriptor`,
        );

      ResolveField(returnValue(relType), {
        nullable: resolverInfo.agField?.gqlOptions?.nullable,
      })(resolver.prototype, resolverInfo.relation.propertyName, descriptor);

      Parent()(resolver.prototype, resolverInfo.relation.propertyName, 0);

      AgGridArgsSingle({ fieldType: relType, entityType: relType })(
        resolver.prototype,
        resolverInfo.relation.propertyName,
        1,
      );

      // without the design:paramtypes metadata
      // it won't work, the following instruction is transpiled and generated
      // when the decorators are defined in their standard way.
      Reflect.metadata('design:paramtypes', [Object, Array])(
        resolver.prototype,
        resolverInfo.relation.propertyName,
      );
    }
  }
}
export function defineGetSingleResource<Entity extends Record<string, any>>(
  queryName: string,
  returnType: ClassType,
  resolver: ClassType<GenericResolver>,
  methodOptions: GenericResolverQueryOptions,
) {
  Object.defineProperty(resolver.prototype, queryName, {
    configurable: true,
    writable: true,
    value: async function (
      findOptions: AgGridFindManyOptions<Entity>,
      ctx: ExecutionContext,
      id?: string,
    ): Promise<Entity | null> {
      const dataLoader: GQLDataLoader<Entity> = this.dataLoader;

      const gqlCtx = GqlExecutionContext.create(ctx);

      let finalId;
      if (methodOptions.idName && isIDArg(methodOptions.idName)) {
        finalId = methodOptions.idName.filterMiddleware
          ? methodOptions.idName.filterMiddleware(gqlCtx, id)
          : id;
      } else {
        finalId = id;
      }

      checkFinalId(finalId);

      return dataLoader.loadOne(
        [dataLoader.getSearchKey(), finalId],
        findOptions,
        methodOptions.throwOnNotFound ?? false,
      );
    },
  });

  const descriptor = Object.getOwnPropertyDescriptor(
    resolver.prototype,
    queryName,
  );

  if (!descriptor)
    throw new ReferenceError(
      `${resolver.name}.${queryName} must have a descriptor`,
    );

  applyDecorators(
    ...generateDecorators(
      Query,
      queryName,
      methodOptions.returnType ?? returnValue(returnType),
      methodOptions,
    ),
  )(resolver.prototype, queryName, descriptor);

  const fieldType = methodOptions.returnType?.() ?? returnType;

  const entityType =
    !isClass(fieldType) && typeof fieldType === 'function'
      ? fieldType()
      : fieldType;

  AgGridArgsSingle({
    fieldType,
    entityType,
  })(resolver.prototype, queryName, 0);

  GetContext()(resolver.prototype, queryName, 1);

  if (methodOptions.idName && isIDArg(methodOptions.idName)) {
    if (!methodOptions.idName.hidden) {
      Args(methodOptions.idName.name, {
        nullable: false,
        type: returnValue(String),
      })(resolver.prototype, queryName, 2);
    }
  } else {
    Args(methodOptions.idName ?? 'ID', {
      nullable: false,
      type: returnValue(String),
    })(resolver.prototype, queryName, 2);
  }

  Reflect.metadata('design:paramtypes', [Object, Array])(
    resolver.prototype,
    queryName,
  );
}
export function defineGetGridResource<Entity extends Record<string, any>>(
  queryName: string,
  returnType: ClassType,
  resolver: ClassType<GenericResolver>,
  methodOptions: GenericResolverQueryOptions,
) {
  Object.defineProperty(resolver.prototype, queryName, {
    configurable: true,
    writable: true,
    value: async function (
      findOptions: AgGridFindManyOptions,
    ): Promise<[Entity[], number]> {
      return this.service.getEntityListAgGrid(findOptions, true);
    },
  });

  const descriptor = Object.getOwnPropertyDescriptor(
    resolver.prototype,
    queryName,
  );

  if (!descriptor)
    throw new ReferenceError(
      `${resolver.name}.${queryName} must have a descriptor`,
    );

  applyDecorators(
    ...generateDecorators(
      Query,
      queryName,
      methodOptions.returnType ??
        returnValue(AgGridGqlType<Entity>(returnType)),
      methodOptions,
    ),
  )(resolver.prototype, queryName, descriptor);

  UseInterceptors(new AgGridInterceptor())(
    resolver.prototype,
    queryName,
    descriptor,
  );

  const fieldType = methodOptions.returnType?.() ?? returnType;
  const entityType =
    !isClass(fieldType) && typeof fieldType === 'function'
      ? fieldType()
      : fieldType;

  const extraArgTypes: any[] = [];
  if (hasExtraArgs(methodOptions)) {
    AgGridArgs({
      fieldType,
      entityType,
      extraArgs: methodOptions.extraArgs,
      extraArgsStrategy: methodOptions.extraArgsStrategy,
      // type: returnValue(agQueryParamsFactory(methodOptions.defaultValue)),
    })(resolver.prototype, queryName, 0);

    if (methodOptions.extraArgs) {
      Object.values(methodOptions.extraArgs).map((a) => {
        if (!a.hidden) extraArgTypes.push(filterTypeToNativeType(a.filterType));
      });
    }
  } else {
    AgGridArgs({
      fieldType,
      entityType,
    })(resolver.prototype, queryName, 0);
  }

  Reflect.metadata('design:paramtypes', [Object])(
    resolver.prototype,
    queryName,
  );
}
