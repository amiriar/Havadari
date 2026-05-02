import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsEntity } from '../entities/sms.entity';

@Injectable()
export class SmsRepository extends Repository<SmsEntity> {
  constructor(
    @InjectRepository(SmsEntity)
    private readonly repository: Repository<SmsEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async updateAndReturn(
    sms: SmsEntity,
    data: Partial<SmsEntity>,
  ): Promise<SmsEntity> {
    Object.assign(sms, data);
    return await this.save(sms);
  }
}
