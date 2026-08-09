import { DynamicModule, ForwardReference, Type } from '@nestjs/common';

export type ImportType =
  | Type<unknown>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference<unknown>;

export type DecoratorType =
  | ClassDecorator
  | MethodDecorator
  | PropertyDecorator;
