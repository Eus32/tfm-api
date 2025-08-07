import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Logger } from 'winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const responseTime = Date.now() - startTime;
        this.logger.log({
          level: 'info',
          action: 'response',
          message: JSON.stringify({
            method: request.method,
            url: request.url,
            statusCode: response?.statusCode,
            responseTime: `${responseTime}ms`,
            reqHeaders: request?.headers,
            data: data,
          }),
        });
      }),
    );
  }
}
