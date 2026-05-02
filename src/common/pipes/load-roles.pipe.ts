import { Injectable, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '@app/auth/entities/role.entity';

@Injectable()
export class LoadRolesPipe implements PipeTransform {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async transform(dto: any) {
    if (dto.userInfo?.roles) {
      //find roles
      const roles: Array<Role> = await this.roleRepository.find({
        where: { name: In(dto.userInfo.roles.map((role) => role.name)) },
      });

      //set user roles
      dto.userInfo.roles = roles;
    }

    return dto;
  }
}
