import {
  applyDecorators,
  CallHandler,
  ExecutionContext,
  HttpCode,
  HttpStatus,
  Injectable,
  NestInterceptor,
  Type,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

/** Preenche o header Location com a URL do recurso recém-criado (coleção + "/" + id). */
@Injectable()
export class LocationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      tap((body) => {
        const id = (body as { id?: unknown } | undefined)?.id;
        if (typeof id === 'string') {
          const collection = req.originalUrl.split('?')[0].replace(/\/+$/, '');
          res.location(`${collection}/${id}`);
        }
      }),
    );
  }
}

/** POST que cria recurso: responde 201 Created com o header Location. */
export function CreatedResource(description: string, type?: Type<unknown>) {
  return applyDecorators(
    HttpCode(HttpStatus.CREATED),
    UseInterceptors(LocationInterceptor),
    ApiCreatedResponse({
      description,
      type,
      headers: {
        Location: {
          description: 'URL do recurso criado',
          schema: { type: 'string', example: '/api/customers/{id}' },
        },
      },
    }),
  );
}
