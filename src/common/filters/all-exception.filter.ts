import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { TypeORMError } from 'typeorm';
import { Logger } from "winston";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: Logger,
    private readonly httpAdapterHost: HttpAdapterHost
  ) { }

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const { httpAdapter } = this.httpAdapterHost;

    let code = HttpStatus.INTERNAL_SERVER_ERROR
    let message = ''
    if (exception instanceof HttpException) {
      code = exception.getStatus()
      message = exception.message
    } else if (exception instanceof TypeORMError) {
      message = exception.message
    }



    const responseBody = {
      code,
      message
    };

    console.log('---------ex--', exception)

    httpAdapter.reply(ctx.getResponse(), responseBody);
    this.logger.error(responseBody)
  }
}