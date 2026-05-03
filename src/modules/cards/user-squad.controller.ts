import { User } from '@app/auth/entities/user.entity';
import { User as UserDecorator } from '@common/decorators/user.decorator';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpdateUserSquadDto } from './dto/update-user-squad.dto';
import { UserCardService } from './services/user-card.service';

@ApiTags('squad')
@Controller('user/squad')
export class UserSquadController {
  constructor(private readonly userCardService: UserCardService) {}

  @Get()
  getSquad(@UserDecorator() user: User) {
    return this.userCardService.getActiveSquad(user);
  }

  @Put()
  updateSquad(@UserDecorator() user: User, @Body() dto: UpdateUserSquadDto) {
    return this.userCardService.updateSquad(user, dto);
  }
}
