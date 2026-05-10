import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RealtimeClientEvents, RealtimeServerEvents, REALTIME_NAMESPACE } from './constants/realtime-events.constants';
import { RealtimeSpecResponseDto } from './dto/realtime-spec-response.dto';

@ApiTags('Realtime')
@ApiBearerAuth()
@Controller('realtime')
export class RealtimeController {
  @Get('spec')
  @ApiOperation({ summary: 'Realtime socket contract for frontend clients' })
  @ApiOkResponse({ type: RealtimeSpecResponseDto })
  spec(): RealtimeSpecResponseDto {
    return {
      namespace: REALTIME_NAMESPACE,
      clientEvents: Object.values(RealtimeClientEvents),
      serverEvents: Object.values(RealtimeServerEvents),
      rooms: {
        user: 'user:{userId}',
        battle: 'battle:{battleId}',
        tournament: 'tournament:{tournamentId}',
        clan: 'clan:{clanId}',
      },
    };
  }
}

