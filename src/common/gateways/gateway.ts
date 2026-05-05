import { ONLINE_USERS, ONLINE_USERS_HASH } from '@common/constants/keys';
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { Socket } from 'socket.io';
import { SESSION_REPLACED } from '@common/constants/websocket-events';
export class Gateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  constructor(protected readonly cacheManager: Cache) {}

  afterInit(): void {
    Logger.log('WebSocket gateWay Initialized', 'WebSocket Gateway');
  }

  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    await this.disconnectOtherUserSockets(client);
    await this.setUserOnline(client);

    Logger.log('client Connected', 'WebSocket Gateway');
  }

  async handleDisconnect(@ConnectedSocket() client: Socket): Promise<void> {
    await this.setUserOffline(client);

    Logger.log('client disconnected', 'WebSocket Gateway');
  }

  async setUserOnline(client: Socket) {
    const onlineUsers = await this.getOnlineUsers();
    onlineUsers.add(
      JSON.stringify({
        socketId: client.id,
        user: client.data.user,
      }),
    );

    const onlineUsersHash = await this.getOnlineUsersHash();

    onlineUsersHash.add(client.data.user.id);

    await this.cacheManager.set(
      ONLINE_USERS_HASH,
      Array.from(onlineUsersHash),
      0,
    );

    await this.cacheManager.set(ONLINE_USERS, Array.from(onlineUsers), 0);
    await this.cacheManager.set(
      ONLINE_USERS_HASH,
      Array.from(onlineUsersHash),
      0,
    );
  }

  async setUserOffline(client: Socket) {
    const onlineUsers = await this.getOnlineUsers();
    const filteredOnlineUsers = new Set(
      Array.from(onlineUsers).filter((onlineUser) => {
        return onlineUser?.socketId !== client.id;
      }),
    );

    const onlineUsersHash = await this.getOnlineUsersHash();
    if (client.data?.user?.id) {
      onlineUsersHash.delete(client.data.user.id);
    }

    await this.cacheManager.set(ONLINE_USERS, Array.from(filteredOnlineUsers), 0);
    await this.cacheManager.set(
      ONLINE_USERS_HASH,
      Array.from(onlineUsersHash),
      0,
    );
  }

  async getOnlineUsers(): Promise<Set<any>> {
    const onlineUsersArray: Socket[] =
      await this.cacheManager.get(ONLINE_USERS);
    return new Set(onlineUsersArray);
  }

  async getOnlineUsersArray(): Promise<Array<any>> {
    const onlineUsersArray: [] = await this.cacheManager.get(ONLINE_USERS);
    if (!onlineUsersArray) {
      return [];
    }
    return onlineUsersArray;
  }

  async getOnlineUsersHash() {
    const onlineUsersArray: string[] =
      await this.cacheManager.get(ONLINE_USERS_HASH);
    return new Set(onlineUsersArray);
  }

  private async disconnectOtherUserSockets(client: Socket): Promise<void> {
    const userId = client.data?.user?.id;
    if (!userId) return;

    const sockets = await this.getOnlineUsersArray();
    const duplicatedSockets = sockets.filter(
      (onlineUser) => onlineUser?.user?.id === userId,
    );

    for (const connectedSocket of duplicatedSockets) {
      const socketId: string | undefined = connectedSocket?.socketId;
      if (!socketId || socketId === client.id) continue;

      client.nsp.to(socketId).emit(SESSION_REPLACED, {
        message: 'session replaced by another login',
      });

      const oldSocket = client.nsp.sockets?.get(socketId);
      oldSocket?.disconnect(true);
    }
  }
}
