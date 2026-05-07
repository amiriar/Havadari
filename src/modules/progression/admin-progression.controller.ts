import { READ_USER, UPDATE_USER } from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AtLeastOnePipe } from '@common/pipes/at-least-one.pipe';
import { ProgressionService } from './progression.service';
import { AdminAdjustProgressionDto } from './dto/admin-adjust-progression.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/progression')
export class AdminProgressionController {
  constructor(private readonly progressionService: ProgressionService) {}

  @Get('users/:userId')
  @ApiOperation({ summary: 'Admin: get user progression state' })
  @AuthorizeByPermissions([READ_USER])
  getUserProgression(@Param('userId') userId: string) {
    return this.progressionService.adminGet(userId);
  }

  @Post('users/:userId/adjust')
  @ApiOperation({ summary: 'Admin: adjust user progression values' })
  @AuthorizeByPermissions([UPDATE_USER])
  adjustUserProgression(
    @Param('userId') userId: string,
    @Body(new AtLeastOnePipe(['expDelta', 'trophiesDelta', 'setLevel', 'setExp']))
    dto: AdminAdjustProgressionDto,
  ) {
    return this.progressionService.adminAdjust(userId, dto);
  }
}

