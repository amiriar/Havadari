import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { User } from '@common/decorators/user.decorator';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpdateUserSquadDto } from './dto/update-user-squad.dto';
import { UserCardService } from './services/user-card.service';

@ApiTags('squad')
@Controller('user/squad')
export class UserSquadController {
  constructor(private readonly userCardService: UserCardService) {}

  @Get()
  getSquad(@User() user: CurrentUser) {
    return this.userCardService.getActiveSquad(user.id);
  }

  @Put()
  updateSquad(@User() user: CurrentUser, @Body() dto: UpdateUserSquadDto) {
    return this.userCardService.updateSquad(user.id, dto);
  }
}
