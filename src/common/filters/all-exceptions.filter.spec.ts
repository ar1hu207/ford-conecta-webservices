import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();
  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', url: '/api/x', ip: '127.0.0.1' }),
      }),
    } as unknown as ArgumentsHost;
  });

  const body = () => json.mock.calls[0][0];

  it('mantém status e mensagem de uma HttpException', () => {
    filter.catch(new NotFoundException('Cliente não encontrado'), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(body()).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Cliente não encontrado',
      path: '/api/x',
    });
  });

  it('preserva a lista de erros de validação', () => {
    filter.catch(new BadRequestException(['a inválido', 'b inválido']), host);
    expect(body().message).toEqual(['a inválido', 'b inválido']);
  });

  it('deriva o rótulo "Unauthorized" quando a exceção não traz "error"', () => {
    filter.catch(new UnauthorizedException(), host);
    expect(body()).toMatchObject({ statusCode: 401, error: 'Unauthorized' });
  });

  it('erro inesperado vira 500 genérico, sem stack nem mensagem interna', () => {
    filter.catch(new Error('senha do banco: 123 at Pool.connect'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(body().message).toBe('Erro interno do servidor');
    expect(JSON.stringify(body())).not.toMatch(/senha|Pool|stack/);
  });

  it('violação de índice único do Postgres vira 409, não 500', () => {
    const driverError = Object.assign(new Error('duplicate key'), { code: '23505' });
    filter.catch(new QueryFailedError('INSERT ...', [], driverError), host);
    expect(status).toHaveBeenCalledWith(409);
    expect(body()).toMatchObject({ error: 'Conflict', message: 'Registro já existente' });
  });
});
