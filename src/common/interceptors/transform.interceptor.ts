/* transform.interceptor.ts */

import { Injectable, NestInterceptor, CallHandler, ExecutionContext } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        const statusCode = res.statusCode || 200;
        const message = typeof data === 'object' && data.message ? data.message : '';
        return {
          data,
          code: statusCode,
          message,
        };
      }),
    );
  }
}