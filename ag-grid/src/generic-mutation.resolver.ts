import { ClassType } from "@nestjs-yalc/types";
import { isClass } from "@nestjs-yalc/utils/class.helper";
import { GetContext } from "@nestjs-yalc/utils/nest.decorator";
import returnValue from "@nestjs-yalc/utils/returnValue";
import { applyDecorators, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext, Mutation } from "@nestjs/graphql";
import { AgGridArgsSingle } from "./ag-grid-args.decorator";
import { AgGridFindManyOptions } from "./ag-grid.interface";
import { ExtraInput, generateDecorators, GenericResolver, GenericResolverMutationCreateOptions, GenericResolverOptions, GenericResolverQueryOptions, isExtraInputStrict } from "./generic-resolver.type";
import { InputArgs } from "./gqlmapper.decorator";

export function defineCreateMutation<Entity extends Record<string, any>>(
  queryName: string,
  returnType: ClassType,
  resolver: ClassType<GenericResolver>,
  options: GenericResolverOptions<Entity>,
  methodOptions: GenericResolverMutationCreateOptions<Entity>,
) {
  const extraInputs = methodOptions.extraInputs;

  Object.defineProperty(resolver.prototype, queryName, {
    configurable: true,
    writable: true,
    value: async function (
      input: Entity,
      findOptions: AgGridFindManyOptions<Entity>,
      ctx: ExecutionContext,
      extraInputsArgs?: { [key: string]: ExtraInput<Entity> },
    ): Promise<Entity | null> {
      const gqlCtx = GqlExecutionContext.create(ctx);

      if (extraInputs)
        Object.keys(extraInputs).forEach((k) => {
          const extraInputObj = extraInputs[k];
          if (isExtraInputStrict<Entity>(extraInputObj)) {
            if (!extraInputsArgs) {
              extraInputsArgs = {};
            }

            extraInputsArgs[k] = extraInputObj.middleware(
              gqlCtx,
              input,
              extraInputsArgs[k],
            ) as any;
          }
        });

      return this.service.createEntity(input, findOptions);
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
      Mutation,
      queryName,
      methodOptions.returnType ?? returnValue(returnType),
      methodOptions,
    ),
  )(resolver.prototype, queryName, descriptor);

  InputArgs({
    gql: {
      type:
        /* istanbul ignore next */
        () => options.input?.create ?? returnType,
    },
    fieldType: options.input?.create ?? returnType,
    _name: 'input',
  })(resolver.prototype, queryName, 0);

  const fieldType = methodOptions.returnType?.() ?? returnType;
  const entityType =
    !isClass(fieldType) && typeof fieldType === 'function'
      ? fieldType()
      : fieldType;

  AgGridArgsSingle({
    fieldType,
    entityType,
  })(resolver.prototype, queryName, 1);

  GetContext()(resolver.prototype, queryName, 2);

  if (extraInputs) {
    Object.keys(extraInputs).forEach((k, i) => {
      const extraInputObj = extraInputs[k];

      if (!extraInputObj.gqlOptions) return;

      InputArgs({
        gql: extraInputObj.gqlOptions,
        fieldType: extraInputObj.gqlOptions.type,
        _name: k,
      })(resolver.prototype, queryName, 3 + i);
    });
  }

  Reflect.metadata('design:paramtypes', [Object])(
    resolver.prototype,
    queryName,
  );
}
export function defineUpdateMutation<Entity extends Record<string, any>>(
  queryName: string,
  returnType: ClassType,
  resolver: ClassType<GenericResolver>,
  options: GenericResolverOptions<Entity>,
  methodOptions: GenericResolverQueryOptions,
) {
  Object.defineProperty(resolver.prototype, queryName, {
    configurable: true,
    writable: true,
    value: async function (
      conditions: Entity,
      input: Entity,
      findOptions: AgGridFindManyOptions<Entity>,
    ): Promise<Entity | null> {
      return this.service.updateEntity(conditions, input, findOptions);
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
      Mutation,
      `${options.prefix ?? ''}update${options.entityModel.name}`,
      methodOptions.returnType ?? returnValue(returnType),
      methodOptions,
    ),
  )(resolver.prototype, queryName, descriptor);

  InputArgs({
    fieldType: options.input?.conditions ?? returnType,
    gql: {
      type:
        /* istanbul ignore next */
        () => options.input?.conditions ?? returnType,
    },
    _name: 'conditions',
  })(resolver.prototype, queryName, 0);

  InputArgs({
    fieldType: options.input?.update ?? returnType,
    gql: {
      type:
        /* istanbul ignore next */
        () => options.input?.update ?? returnType,
    },
    _name: 'input',
  })(resolver.prototype, queryName, 1);

  const fieldType = methodOptions.returnType?.() ?? returnType;
  const entityType =
    !isClass(fieldType) && typeof fieldType === 'function'
      ? fieldType()
      : fieldType;

  AgGridArgsSingle({
    fieldType,
    entityType,
  })(resolver.prototype, queryName, 2);

  Reflect.metadata('design:paramtypes', [Object, Object])(
    resolver.prototype,
    queryName,
  );
}
export function defineDeleteMutation<Entity extends Record<string, any>>(
  queryName: string,
  returnType: ClassType,
  resolver: ClassType<GenericResolver>,
  options: GenericResolverOptions<Entity>,
  methodOptions: GenericResolverQueryOptions,
) {
  Object.defineProperty(resolver.prototype, queryName, {
    configurable: true,
    writable: true,
    value: async function (conditions: Entity): Promise<boolean> {
      return this.service.deleteEntity(conditions);
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
      Mutation,
      queryName,
      returnValue(Boolean),
      methodOptions,
    ),
  )(resolver.prototype, queryName, descriptor);

  InputArgs({
    fieldType: options.input?.conditions ?? returnType,
    gql: {
      type:
        /* istanbul ignore next */
        () => options.input?.conditions ?? returnType,
    },
    _name: 'conditions',
  })(resolver.prototype, queryName, 0);

  Reflect.metadata('design:paramtypes', [Object])(
    resolver.prototype,
    queryName,
  );
}
