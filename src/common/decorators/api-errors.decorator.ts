import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';

const DESCRIPTIONS: Record<number, string> = {
  400: 'Entrada inválida (validação do DTO, UUID malformado ou campo não permitido).',
  401: 'Token ausente, inválido ou expirado.',
  403: 'Papel sem permissão, ou recurso de outro cliente.',
  404: 'Recurso não encontrado.',
  406: 'Formato pedido no header Accept não é suportado.',
  409: 'Conflito com um recurso existente (unicidade).',
  429: 'Limite de requisições excedido.',
};

/** Documenta no Swagger as respostas de erro da rota, todas no envelope ErrorResponseDto. */
export function ApiErrors(...statuses: number[]) {
  return applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({ status, description: DESCRIPTIONS[status], type: ErrorResponseDto }),
    ),
  );
}

/** Rota protegida: exige Bearer JWT e pode responder 401, 403 e 429. */
export function ApiProtected() {
  return applyDecorators(ApiBearerAuth('access-token'), ApiErrors(401, 403, 429));
}
