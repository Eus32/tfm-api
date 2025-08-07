import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly redactFields = ['password', 'token', 'authorization'];
  
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) { }

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const timestamp = Date.now();
    const { method, originalUrl, headers, body, query } = req;

    res.setHeader('X-Request-ID', requestId);

    // Sanitize sensitive data

    this.logger.info({
      requestId,
      stage: 'start',
      method,
      url: originalUrl,
      timestamp,
      headers,
      query,
      body,
      ip: req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress
    });

    const startHrTime = process.hrtime();

    res.on('finish', () => {
      const durationMs = this.calculateDuration(startHrTime);
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      
      this.logger[logLevel]({
        requestId,
        stage: 'end',
        statusCode: res.statusCode,
        duration: `${durationMs} ms`,
        method,
        url: originalUrl,
        responseSize: res.getHeader('content-length')
      });
    });

    res.on('error', (err) => {
      const errorTime = this.calculateDuration(startHrTime);

      this.logger.error({
        requestId,
        stage: 'error',
        error: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        method,
        url: originalUrl,
        duration: `${errorTime} ms`,
      });
    });

    next();
  }

  private calculateDuration(startHrTime: [number, number]): string {
    const NS_PER_SEC = 1e9;
    const NS_TO_MS = 1e6;
    const diff = process.hrtime(startHrTime);
    const durationMs = (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
    return durationMs.toFixed(2);
  }
}