import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateParameterEntity } from './entities/template-parameter.entity';

@Injectable()
export class TemplateParameterService {
  constructor(
    @InjectRepository(TemplateParameterEntity)
    private readonly repo: Repository<TemplateParameterEntity>,
  ) {}

  async findAll(): Promise<TemplateParameterEntity[]> {
    return this.repo.find({});
  }
}
