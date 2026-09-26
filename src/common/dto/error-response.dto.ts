import { ApiProperty } from '@nestjs/swagger';

/** Envelope único de erro devolvido por toda a API (ver AllExceptionsFilter). */
export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Cliente não encontrado' },
      { type: 'array', items: { type: 'string' }, example: ['email must be an email'] },
    ],
    description: 'Mensagem, ou lista de mensagens quando a validação de entrada falha',
  })
  message: string | string[];

  @ApiProperty({ example: '/api/customers/00000000-0000-0000-0000-000000000000' })
  path: string;

  @ApiProperty({ example: '2026-09-26T12:00:00.000Z' })
  timestamp: string;
}
