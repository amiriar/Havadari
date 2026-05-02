import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';
import { Injectable, PipeTransform } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class SetGuestRolePipe implements PipeTransform {
  async transform(dto: RegisterDto) {
    if (!dto.roles) {
      dto.roles = [];
    }

    if (dto.roles.length === 0) {
      dto.roles.push({
        name: ApplicationMainRoles.GUEST,
      });
    }

    return dto;
  }
}
