import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ResolveTournamentMatchDto {
  @ApiPropertyOptional({
    description: 'Winner participant id (optional). If omitted, winner is determined by score/random fallback.',
  })
  @IsOptional()
  @IsUUID()
  winnerParticipantId?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 20, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  scoreA?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 20, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  scoreB?: number;
}

