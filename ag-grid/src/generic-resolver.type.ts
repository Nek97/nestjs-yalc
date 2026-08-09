import { DecoratorType, FieldMapper } from "@nestjs-yalc/interfaces";
import { ClassType } from "@nestjs-yalc/types";
import { Query } from "@nestjs/common";
import { ArgsOptions, GqlExecutionContext, Mutation, MutationOptions, QueryOptions, ReturnTypeFunc } from "@nestjs/graphql";
import { AgQueryParams } from "./ag-grid.args";
import { ExtraArgsStrategy } from "./ag-grid.enum";
import { AgGridFindManyOptions, DArg, ExtraArg } from "./ag-grid.interface";

export interface GenericResolver {
  [index: string]: any; //index signature
}
export interface GenericResolverMethodOptions {
  disabled?: boolean;
  queryParams?: QueryOptions | MutationOptions;
  returnType?: ReturnTypeFunc;
  /**
   * @deprecated please use the property decorator alternative instead
   */
  fieldMap?: FieldMapper;
  decorators?: DecoratorType[];
  defaultValue?: AgQueryParams | any;
  /**
   * Filters with direct arguments
   */
  extraArgsStrategy?: ExtraArgsStrategy;
  extraArgs?: {
    [index: string]: ExtraArg;
  };
}
export interface ExtraInput<Type> {
  middleware?: {
    (ctx: GqlExecutionContext, input: Type, filterValue?: any): any;
  };
  gqlOptions?: ArgsOptions;
}
export interface ExtraInputStrict<Type> {
  middleware: {
    (ctx: GqlExecutionContext, input: Type, filterValue?: any): any;
  };
  gqlOptions?: ArgsOptions;
}
export interface GenericResolverMutationCreateOptions<Type>
  extends GenericResolverMethodOptions {
  extraInputs?: { [key: string]: ExtraInput<Type> };
}
export interface GenericResolverQueryOptions
  extends GenericResolverMethodOptions {
  idName?: string | DArg;
  throwOnNotFound?: boolean;
}
export interface CustomSingleQueryOptions
  extends GenericResolverMethodOptions {
  isSingleResource: true;
  throwOnNotFound?: boolean;
  idName?: string;
}
export interface GenericResolverOptions<Entity> {
  entityModel: ClassType<Entity>;
  dto?: ClassType;
  input?: {
    create?: ClassType;
    update?: ClassType;
    conditions?: ClassType;
  };
  prefix?: string;
  queries?: {
    getResource?: GenericResolverQueryOptions;
    getResourceGrid?: GenericResolverMethodOptions;
  };
  customQueries?: {
    [index: string]: GenericResolverQueryOptions | CustomSingleQueryOptions;
  };
  mutations?: {
    createResource: GenericResolverMutationCreateOptions<Entity>;
    deleteResource: GenericResolverMethodOptions;
    updateResource: GenericResolverMethodOptions;
  };
  /** exclude create/delete/update mutations automatically */
  readonly?: boolean;
  /**
   * Override default service. It requires both service and the related dataloader
   */
  service?: {
    /**
     * Override default dataloader (must be based on class GQLDataLoader)
     */
    dataLoaderToken?: string;
    /**
     * Override default service (must be based on class GenericService)
     */
    serviceToken?: string;
  };
}
export function isIDArg(arg: string | DArg): arg is DArg {
  return !!(<DArg>arg).name;
}
export function isExtraInputStrict<Entity>(
  input: undefined | ExtraInput<Entity>,
): input is ExtraInputStrict<Entity> {
  const casted = input as ExtraInputStrict<Entity>;
  return !!casted.middleware;
}
export function checkFinalId(finalId: string | undefined) {
  if (typeof finalId === 'undefined') {
    throw new Error("Can't have an undefined ID");
  }
}
export function isCustomSingleQueryOptions(
  option: GenericResolverQueryOptions | CustomSingleQueryOptions,
): option is CustomSingleQueryOptions {
  return (<CustomSingleQueryOptions>option).isSingleResource === true;
}
export function hasExtraArgs(option: GenericResolverQueryOptions): boolean {
  return !!(<GenericResolverQueryOptions>option).extraArgs;
}
export function hasFilters(findOptions: AgGridFindManyOptions) {
  return (
    (findOptions.where &&
      Object.values(findOptions.where.filters).length > 0) ||
    (findOptions.order && Object.values(findOptions.order).length > 0)
  );
}
export function generateDecorators(
  methodFn: typeof Query | typeof Mutation,
  defaultName: string,
  typeFunc: ReturnTypeFunc,
  options?: GenericResolverMethodOptions,
) {
  if (options?.disabled) return [];

  return [
    ...(options?.decorators ?? []),
    methodFn(typeFunc, {
      ...options?.queryParams,
      name: options?.queryParams?.name ?? defaultName,
    }),
  ] as any[];
}
