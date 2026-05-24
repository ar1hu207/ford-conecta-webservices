import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealershipsController } from './dealerships.controller';
import { DealershipsService } from './dealerships.service';
import { Dealership } from './entities/dealership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dealership])],
  controllers: [DealershipsController],
  providers: [DealershipsService],
  exports: [DealershipsService],
})
export class DealershipsModule {}
