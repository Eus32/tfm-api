import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import * as geoip from 'geoip-lite';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly redactFields = ['password', 'token', 'authorization'];

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  use(
    req: Request & { throttleInfo?: any },
    res: Response,
    next: NextFunction,
  ) {
    const requestId = uuidv4();
    const timestamp = Date.now();
    const { method, originalUrl, headers, body, query, params, ip } = req;

    res.setHeader('X-Request-ID', requestId);

    const hash = (value: string) =>
      crypto.createHash('sha256').update(value).digest('hex');

    const logData = {
      timestamp: new Date().toISOString(),
      request: {
        http_method: method,
        endpoint: originalUrl,
        query_params_count: Object.keys(query).length,
        path_params: params,
        headers: {
          user_agent: headers['user-agent'] || '',
          content_type: headers['content-type'] || '',
          accept: headers['accept'] || '',
          authorization_present: !!headers['authorization'],
        },
        client: {
          ip_hash: hash(ip || ''),
          geo_country: geoip.lookup(ip || '')?.country, // Puedes usar geoip-lite aquí
          geo_region: geoip.lookup(ip || '')?.region,
        },
        payload_metadata: {
          content_length_bytes: Number(headers['content-length'] || 0),
          num_fields: Object.keys(body || {}).length,
          avg_field_length: this.getAverageFieldLength(body),
        },
      },
      session: {
        user_id_hash: body?.userId ? hash(body.userId) : null,
        session_id_hash: Array.isArray(headers['x-session-id'])
          ? headers['x-session-id'].join(',')
          : req.headers.authorization ?? '',
        origin: headers['origin'] || null,
      },
      security: {
        failed_auth_attempts_last_10min: req?.throttleInfo?.totalHits,
        // rate_limit_hits: 0,
        suspicious_patterns_detected: this.detectSuspiciousPatterns(
          query,
          body,
          headers,
        ),
        // unusual_headers: false,
      },
    };

    /**
    this.logger.info({
      requestId,
      stage: 'start',
      method,
      url: originalUrl,
      timestamp,
      headers,
      query,
      body,
      ip: req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress,
    });
     */

    const startHrTime = process.hrtime();

    res.on('finish', () => {
      const durationMs = this.calculateDuration(startHrTime);
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';

      const responseSuccess = {
        requestId,
        stage: 'end',
        statusCode: res.statusCode,
        duration: `${durationMs} ms`,
        method,
        url: originalUrl,
        responseSize: res.getHeader('content-length'),
      };

      this.logger[logLevel]({ ...logData, response: responseSuccess });
    });

    res.on('error', (err) => {
      const errorTime = this.calculateDuration(startHrTime);

      const responseError = {
        requestId,
        stage: 'error',
        error: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        method,
        url: originalUrl,
        duration: `${errorTime} ms`,
      }

      this.logger.error({ ...logData, response: responseError });
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

  private getAverageFieldLength(obj: Record<string, any>): number {
    if (!obj || typeof obj !== 'object') return 0;
    const values = Object.values(obj);
    const lengths = values.map((v) =>
      typeof v === 'string' ? v.length : JSON.stringify(v).length,
    );
    return lengths.length
      ? lengths.reduce((a, b) => a + b, 0) / lengths.length
      : 0;
  }

  private detectSuspiciousPatterns(
    query: any,
    body: any,
    headers: any,
  ): string[] {
    const input = JSON.stringify({ query, body, headers });
    const patterns = [];
    if (/union\s+select/i.test(input)) patterns.push('sql_injection');
    if (/<script>/i.test(input)) patterns.push('xss');
    return patterns.length ? patterns : ['none'];
  }
}
