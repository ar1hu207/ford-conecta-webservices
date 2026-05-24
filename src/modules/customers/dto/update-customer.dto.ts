import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';

/** Todos os campos opcionais — atualização parcial (PATCH/PUT). */
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
