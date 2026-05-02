import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @AuthorizeByPermissions(['GET_HELLO'])
  @Get('/')
  getHello(): string {
    return this.appService.getHello();
  }
}
