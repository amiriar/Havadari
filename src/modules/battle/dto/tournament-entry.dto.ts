import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TournamentEntryTypeEnum } from '../constants/tournament.enums';

export class TournamentEntryDto {
  @ApiProperty({ enum: TournamentEntryTypeEnum })
  @IsEnum(TournamentEntryTypeEnum)
  entryType: TournamentEntryTypeEnum;
}

