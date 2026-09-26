import { PartialType } from '@nestjs/swagger';
import { CreateDealershipDto } from './create-dealership.dto';

/** Atualização parcial (PATCH): todos os campos opcionais. */
export class UpdateDealershipDto extends PartialType(CreateDealershipDto) {}
