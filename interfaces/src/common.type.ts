export type ClassType<T = unknown> = new (...args: unknown[]) => T;
export type FactoryType<T> = (faker?: unknown) => T;
