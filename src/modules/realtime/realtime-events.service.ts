import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { battleRoom, clanRoom, tournamentRoom, userRoom } from './constants/realtime-events.constants';

@Injectable()
export class RealtimeEventsService {
  private io: Server | null = null;

  setServer(io: Server) {
    this.io = io;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    if (!this.io) return;
    this.io.to(userRoom(userId)).emit(event, payload);
  }

  emitToBattle(battleId: string, event: string, payload: unknown) {
    if (!this.io) return;
    this.io.to(battleRoom(battleId)).emit(event, payload);
  }

  emitToTournament(tournamentId: string, event: string, payload: unknown) {
    if (!this.io) return;
    this.io.to(tournamentRoom(tournamentId)).emit(event, payload);
  }

  emitToClan(clanId: string, event: string, payload: unknown) {
    if (!this.io) return;
    this.io.to(clanRoom(clanId)).emit(event, payload);
  }
}

