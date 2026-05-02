import { User as AuthUser } from '@app/auth/entities/user.entity';
import { User } from '@common/decorators/user.decorator';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpdateSquadDto } from '../dto';
import { SquadService } from './squad.service';

@ApiTags('game-squad')
@Controller('user')
export class SquadController {
  constructor(private readonly service: SquadService) {}

  @Get('squad')
  getSquad(@User() user: AuthUser) {
    return this.service.getSquad(user);
  }

  @Put('squad')
  updateSquad(@User() user: AuthUser, @Body() dto: UpdateSquadDto) {
    return this.service.updateSquad(user, dto);
  }
}
