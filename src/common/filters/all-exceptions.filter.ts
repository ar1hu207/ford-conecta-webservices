import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/** Código do Postgres para violação de índice único. */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * Filtro global de exceções.
 *
 * - Padroniza TODA resposta de erro num único formato JSON (ErrorResponseDto).
 * - Nunca expõe stack trace, estrutura interna ou tecnologia ao cliente
 *   (Cybersecurity: tratamento seguro de erros). O detalhe completo só vai pro log do servidor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = this.reasonPhrase(status);
    let message: string | string[] = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
        error = this.reasonPhrase(status);
      } else if (res && typeof res === 'object') {
        const body = res as Record<string, unknown>;
        message = (body.message as string | string[]) ?? this.reasonPhrase(status);
        // Deriva o rótulo do status quando a exceção não fornece "error"
        // (ex.: UnauthorizedException do Passport só traz "message").
        error = (body.error as string) ?? this.reasonPhrase(status);
      }
    } else if (this.isUniqueViolation(exception)) {
      // Corrida entre a checagem de unicidade no service e o INSERT: vira 409, não 500.
      status = HttpStatus.CONFLICT;
      error = this.reasonPhrase(status);
      message = 'Registro já existente';
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // 5xx: loga o detalhe no servidor, mas responde de forma genérica ao cliente.
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (
      status === HttpStatus.UNAUTHORIZED ||
      status === HttpStatus.FORBIDDEN ||
      status === HttpStatus.TOO_MANY_REQUESTS
    ) {
      // Falhas de acesso ficam registradas para auditoria (sem dados sensíveis).
      this.logger.warn(`${request.method} ${request.url} -> ${status} (ip=${request.ip})`);
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private isUniqueViolation(exception: unknown): boolean {
    return (
      exception instanceof QueryFailedError &&
      (exception.driverError as { code?: string } | undefined)?.code ===
        PG_UNIQUE_VIOLATION
    );
  }

  /** Texto-padrão (reason phrase) para os códigos HTTP mais comuns. */
  private reasonPhrase(status: number): string {
    const map: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      406: 'Not Acceptable',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      503: 'Service Unavailable',
    };
    return map[status] ?? 'Error';
  }
}
