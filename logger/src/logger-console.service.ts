/* eslint-disable no-console */
import { LogLevel } from '@nestjs/common';
import { LoggerAbstractService } from './logger-abstract.service';

export class ConsoleLogger extends LoggerAbstractService {
  constructor(context: string, logLevels: LogLevel[] | undefined) {
    super(context, logLevels, {
      log: (message): void => console.log(`[${context}]`, message),
      error: (message, trace): void => console.error(`[${context}]`, message, trace),
      debug: (message): void => console.debug(`[${context}]`, message),
      warn: (message): void => console.warn(`[${context}]`, message),
      verbose: (message): void => console.info(`[${context}]`, message),
    });
  }
}
