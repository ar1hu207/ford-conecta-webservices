import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';

/**
 * Atualização parcial. O cliente dono (customerId) não pode ser trocado por aqui —
 * para isso, cria-se um novo registro de veículo.
 */
export class UpdateVehicleDto extends PartialType(
  OmitType(CreateVehicleDto, ['customerId'] as const),
) {}
