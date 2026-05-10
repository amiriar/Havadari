import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { ClansService } from '@app/clans/clans.service';
import { Logger, UnauthorizedException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  battleRoom,
  clanRoom,
  REALTIME_NAMESPACE,
  RealtimeClientEvents,
  RealtimeServerEvents,
  userRoom,
} from './constants/realtime-events.constants';
import { RealtimeEventsService } from './realtime-events.service';

@WebSocketGateway({
  namespace: REALTIME_NAMESPACE,
  cors: { origin: '*' },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly realtimeEventsService: RealtimeEventsService,
    private readonly clansService: ClansService,
  ) {}

  afterInit() {
    this.realtimeEventsService.setServer(this.server);
    this.logger.log(`Initialized namespace ${REALTIME_NAMESPACE}`);
  }

  async handleConnection(client: Socket) {
    const user = client.data.user as CurrentUser | undefined;
    if (!user?.id) {
      client.emit(RealtimeServerEvents.ERROR, {
        message: 'Authentication required.',
      });
      client.disconnect(true);
      return;
    }
    await client.join(userRoom(user.id));
    client.emit(RealtimeServerEvents.CONNECTED, {
      socketId: client.id,
      userId: user.id,
      namespace: REALTIME_NAMESPACE,
    });
  }

  @SubscribeMessage(RealtimeClientEvents.SUBSCRIBE_BATTLE)
  async subscribeBattle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { battleId: string },
  ) {
    const user = this.requireUser(client);
    if (!body?.battleId) {
      throw new UnauthorizedException('battleId is required.');
    }
    await client.join(battleRoom(body.battleId));
    return { ok: true, userId: user.id, room: battleRoom(body.battleId) };
  }

  @SubscribeMessage(RealtimeClientEvents.UNSUBSCRIBE_BATTLE)
  async unsubscribeBattle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { battleId: string },
  ) {
    if (!body?.battleId) {
      throw new UnauthorizedException('battleId is required.');
    }
    await client.leave(battleRoom(body.battleId));
    return { ok: true, room: battleRoom(body.battleId) };
  }

  @SubscribeMessage(RealtimeClientEvents.SUBSCRIBE_CLAN)
  async subscribeClan(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { clanId: string },
  ) {
    const user = this.requireUser(client);
    if (!body?.clanId) throw new UnauthorizedException('clanId is required.');
    await this.clansService.assertMember(user.id, body.clanId);
    await client.join(clanRoom(body.clanId));
    return { ok: true, userId: user.id, room: clanRoom(body.clanId) };
  }

  @SubscribeMessage(RealtimeClientEvents.UNSUBSCRIBE_CLAN)
  async unsubscribeClan(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { clanId: string },
  ) {
    if (!body?.clanId) throw new UnauthorizedException('clanId is required.');
    await client.leave(clanRoom(body.clanId));
    return { ok: true, room: clanRoom(body.clanId) };
  }

  @SubscribeMessage(RealtimeClientEvents.SEND_CLAN_MESSAGE)
  async sendClanMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { clanId: string; message: string },
  ) {
    const user = this.requireUser(client);
    const result = await this.clansService.sendMessage(user.id, body.clanId, {
      message: body.message,
    });
    this.realtimeEventsService.emitToClan(
      body.clanId,
      RealtimeServerEvents.CLAN_MESSAGE_CREATED,
      result,
    );
    return result;
  }

  private requireUser(client: Socket) {
    const user = client.data.user as CurrentUser | undefined;
    if (!user?.id) throw new UnauthorizedException('Authentication required.');
    return user;
  }
}
