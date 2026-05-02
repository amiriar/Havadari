import { Socket } from 'socket.io';

export function getSocketToken(socket: Socket): string {
  return socket.handshake.headers.authorization;
}
