import { Injectable, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RegisterDto } from '../dto/register.dto';
import { Role } from '../entities/role.entity';

@Injectable()
export class LoadRolesPipe implements PipeTransform {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async transform(dto: RegisterDto) {
    if (dto.roles) {
      //find roles
      const roles: Array<Role> = await this.roleRepository.find({
        where: { name: In(dto.roles.map((role) => role.name)) },
      });

      //set user roles
      dto.roles = roles;
    }

    return dto;
  }
}
