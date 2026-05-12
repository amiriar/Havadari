import {
  CREATE_USER,
  DELETE_USER,
  READ_USER,
  UPDATE_USER,
} from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CardGenerationService } from './services/card-generation.service';
import { AdminCardQueryDto } from './dto/admin-card-query.dto';
import { AdminCreateCardDto } from './dto/admin-create-card.dto';
import { AdminUpdateCardDto } from './dto/admin-update-card.dto';
import { AdminReviewCardsQueryDto } from './dto/admin-review-cards-query.dto';
import { AdminFlagCardImageDto } from './dto/admin-flag-card-image.dto';
import { User } from '@common/decorators/user.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/cards')
export class AdminCardsController {
  constructor(private readonly cardsService: CardGenerationService) {}

  @Get()
  @NoCache()
  @ApiOperation({ summary: 'Admin: list cards' })
  @AuthorizeByPermissions([READ_USER])
  list(@Query() query: AdminCardQueryDto, @Url() url?: string) {
    return this.cardsService.adminList(query, url);
  }

  @Get('export/checklist')
  @NoCache()
  @ApiOperation({
    summary:
      'Admin: export cards to Excel checklist files (100 cards per file)',
  })
  @AuthorizeByPermissions([READ_USER])
  exportChecklist() {
    return this.cardsService.exportChecklistExcels(100);
  }

  @Get('review/high-value')
  @NoCache()
  @ApiOperation({
    summary:
      'Admin: list high-value cards for image/name verification and mismatch review',
  })
  @AuthorizeByPermissions([READ_USER])
  highValueReview(@Query() query: AdminReviewCardsQueryDto, @Url() url?: string) {
    return this.cardsService.adminListHighValueForReview(query, url);
  }

  @Get(':id')
  @NoCache()
  @ApiOperation({ summary: 'Admin: get card by id' })
  @AuthorizeByPermissions([READ_USER])
  getById(@Param('id') id: string) {
    return this.cardsService.adminGetById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create card' })
  @AuthorizeByPermissions([CREATE_USER])
  create(@Body() dto: AdminCreateCardDto) {
    return this.cardsService.adminCreate(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update card' })
  @AuthorizeByPermissions([UPDATE_USER])
  update(@Param('id') id: string, @Body() dto: AdminUpdateCardDto) {
    return this.cardsService.adminUpdate(id, dto);
  }

  @Patch(':id/image-flag')
  @ApiOperation({ summary: 'Admin: flag or unflag card image mismatch' })
  @AuthorizeByPermissions([UPDATE_USER])
  updateImageFlag(
    @Param('id') id: string,
    @Body() dto: AdminFlagCardImageDto,
    @User() user: { id: string },
  ) {
    return this.cardsService.adminSetImageMismatchFlag(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: delete card' })
  @AuthorizeByPermissions([DELETE_USER])
  delete(@Param('id') id: string) {
    return this.cardsService.adminDelete(id);
  }
}
