import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from 'winston';
import { logger } from 'src/common/logger/logger';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = logger;
  }

  log(message: string | Record<string, any>, context?: string) {
    this.logger.info({ message, context });
  }

  error(message: string | Record<string, any>, trace?: string, context?: string) {
    this.logger.error({ message, trace, context });
  }

  warn(message: string | Record<string, any>, context?: string) {
    this.logger.warn({ message, context });
  }

  debug(message: string | Record<string, any>, context?: string) {
    this.logger.debug({ message, context });
  }

  verbose(message: string | Record<string, any>, context?: string) {
    this.logger.verbose({ message, context });
  }
}