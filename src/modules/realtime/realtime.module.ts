import { ClansModule } from '@app/clans/clans.module';
import { Module } from '@nestjs/common';
import { RealtimeController } from './realtime.controller';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeEventsService } from './realtime-events.service';

@Module({
  imports: [ClansModule],
  controllers: [RealtimeController],
  providers: [RealtimeGateway, RealtimeEventsService],
  exports: [RealtimeEventsService],
})
export class RealtimeModule {}

