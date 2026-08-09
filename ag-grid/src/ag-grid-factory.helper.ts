import {
    DataLoaderFactory,
    getDataloaderToken,
} from '@nestjs-yalc/data-loader/dataloader.helper';
import { ClassType } from '@nestjs-yalc/types';
import {
    ClassProvider,
    ExistingProvider,
    FactoryProvider,
    Provider,
    ValueProvider,
} from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import { JoinColumnMetadataArgs } from 'typeorm/metadata-args/JoinColumnMetadataArgs';
import { RelationMetadataArgs } from 'typeorm/metadata-args/RelationMetadataArgs';
import {
    AgGridRepository,
    AgGridRepositoryFactory,
} from './ag-grid.repository';
import {
    GenericResolverOptions,
    resolverFactory,
} from './generic-resolver.resolver';
import {
    GenericService,
    GenericServiceFactory,
} from './generic-service.service';
import {
    AgGridFieldMetadata
} from './object.decorator';

export interface DependencyObject<Entity extends ObjectLiteral> {
  providers: Array<FactoryProvider | Provider>;
  repository: ClassType<AgGridRepository<Entity>>;
}

export interface ProviderOverride<T = unknown> {
  provider:
    | ClassProvider<T>
    | ValueProvider<T>
    | FactoryProvider<T>
    | ExistingProvider<T>;
}

export interface ResolverOverride<T = unknown> {
  provider: ClassType<T>;
}

interface GenericServiceOptions<Entity extends ObjectLiteral> {
  dbConnection: string;
  entityModel?: ClassType<Entity>;
  /**
   * Used only if the service has not external injected dependency rather than the repository
   */
  providerClass?: ClassType<GenericService<Entity>>;
}

interface DataLoaderOptions<Entity> {
  databaseKey: keyof Entity;
  entityModel?: ClassType<Entity>;
}

export interface AgGridDependencyFactoryOptions<Entity extends ObjectLiteral> {
  entityModel: ClassType<Entity>;
  resolver?:
    | Omit<GenericResolverOptions<Entity>, 'entityModel'>
    | ResolverOverride
    | false;
  service?: GenericServiceOptions<Entity> | ProviderOverride;
  dataloader?: DataLoaderOptions<Entity> | ProviderOverride;
  repository?: ClassType<AgGridRepository<Entity>>;
}

export function isProviderOverride(
  resolver: unknown,
): resolver is ProviderOverride {
  const casted = resolver as ProviderOverride;
  return !!casted.provider;
}

export function AgGridDependencyFactory<Entity extends ObjectLiteral>({
  entityModel,
  dataloader,
  resolver,
  service,
  repository,
}: AgGridDependencyFactoryOptions<Entity>): DependencyObject<Entity> {
  const providers: Provider[] = [];

  const resolverOptions: GenericResolverOptions<Entity> = {
    ...(resolver ?? {}),
    entityModel,
  };

  let dataLoaderToken, serviceToken;

  if (service) {
    if (isProviderOverride(service)) {
      serviceToken = getProviderToken(service.provider.provide);
      providers.push(service.provider);
    } else {
      const provider = GenericServiceFactory<Entity>(
        service.entityModel ?? entityModel,
        service.dbConnection,
        service.providerClass,
      );

      serviceToken = getProviderToken(provider.provide);

      providers.push(provider);

      // We always want a string alias for this provider
      if (typeof provider.provide !== 'string') {
        providers.push({
          provide: serviceToken,
          useExisting: provider.provide,
        });
      }
    }
  }

  if (dataloader) {
    if (isProviderOverride(dataloader)) {
      dataLoaderToken = getProviderToken(dataloader.provider.provide);
      providers.push(dataloader.provider);
    } else {
      dataLoaderToken = getDataloaderToken(
        dataloader.entityModel ?? entityModel,
      );
      providers.push(
        DataLoaderFactory<Entity>(
          dataloader.databaseKey,
          dataloader.entityModel ?? entityModel,
          serviceToken,
        ),
      );
    }
  }

  if (resolver !== false) {
    resolverOptions.service = {
      serviceToken,
      dataLoaderToken,
    };

    providers.push(
      resolver && isProviderOverride(resolver)
        ? resolver.provider
        : resolverFactory<Entity>(resolverOptions),
    );
  }

  return {
    providers,
    repository: repository ?? AgGridRepositoryFactory<Entity>(entityModel),
  };
}

export function getProviderToken(
  // eslint-disable-next-line @typescript-eslint/ban-types
  entity: ClassType | Provider | string | symbol | Function,
): string {
  if (entity && typeof entity === 'object' && entity.provide) {
    return typeof entity.provide === 'function'
      ? entity.provide.name
      : entity.provide.toString();
  }

  return typeof entity === 'function' ? entity.name : entity.toString();
}

export interface RelationInfo {
  relation: RelationMetadataArgs;
  join: JoinColumnMetadataArgs | undefined;
  agField?: AgGridFieldMetadata;
}
