import { User } from '@app/auth/entities/user.entity';
import { Injectable, Scope } from '@nestjs/common';
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private static currentInstance: RequestContextService;
  private user: User;

  constructor() {
    RequestContextService.currentInstance = this;
  }

  public static getInstance() {
    return RequestContextService.currentInstance;
  }

  setUser(user: User) {
    this.user = user;
  }

  getUserId() {
    if (this.user) {
      return this.user.id;
    }
    return null;
  }

  getUser() {
    return this.user;
  }
}
