export type ClassType<T = any> = new (...args: any[]) => T;
export type FactoryType<T> = (faker?: any) => T;
