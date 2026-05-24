import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDealershipDto {
  @ApiProperty({ example: 'Ford Center Norte', maxLength: 140 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  name: string;

  @ApiProperty({ example: 'São Paulo', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city: string;

  @ApiProperty({ example: 'Sudeste', maxLength: 40 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  region: string;
}
