import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PerformanceService } from '../monitoring/performance.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private performanceService: PerformanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const endpoint = `${request.method} ${request.url}`;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.performanceService.trackApiResponseTime(endpoint, duration);
      }),
    );
  }
}
