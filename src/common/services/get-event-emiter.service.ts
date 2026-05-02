import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class GetEventEmmiter {
  private static currentInstance: GetEventEmmiter;

  constructor(private readonly eventEmitter: EventEmitter2) {
    GetEventEmmiter.currentInstance = this;
  }

  public static getInstance() {
    return GetEventEmmiter.currentInstance;
  }

  getEmmiter() {
    return this.eventEmitter;
  }
}
