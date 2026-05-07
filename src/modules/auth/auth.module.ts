import { Global, Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { OtpService } from './services/otp.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JWT_EXPIRE_TIME } from 'src/common/utils/constants.utils';
import { CardsModule } from '../cards/cards.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { ProgressionModule } from '../progression/progression.module';
import { JwtService } from './services/jwt-service';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { UserSearchService } from './services/user-search.service';
import { PermissionController } from './controllers/permission.controller';
import { PermissionService } from './services/permission.service';
import { PermissionCategory } from './entities/permission-category.entity';
import { Permission } from './entities/permission.entity';
import { PermissionCategoryService } from './services/permission-category.service';
import { PermissionCategoryController } from './controllers/permission-categoriey.conroller';
import { Role } from './entities/role.entity';
import { DailyLoginClaim } from './entities/daily-login-claim.entity';
import { DailyLoginRewardConfig } from './entities/daily-login-reward-config.entity';
import { RoleController } from './controllers/role.controller';
import { RoleService } from './services/role.service';
import { DailyLoginService } from './services/daily-login.service';
import { AdminUsersController } from './controllers/admin-users.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Permission,
      PermissionCategory,
      Role,
      DailyLoginClaim,
      DailyLoginRewardConfig,
    ]),
    CardsModule,
    AchievementsModule,
    ProgressionModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: JWT_EXPIRE_TIME,
          },
          verifyOptions: {
            ignoreExpiration: false,
          },
        };
      },
    }),
  ],
  controllers: [
    AuthController,
    UserController,
    PermissionController,
    PermissionCategoryController,
    RoleController,
    AdminUsersController,
  ],
  providers: [
    AuthService,
    OtpService,
    JwtService,
    UserService,
    UserSearchService,
    PermissionService,
    PermissionCategoryService,
    RoleService,
    DailyLoginService,
  ],
  exports: [
    JwtService,
    UserService,
    AuthService,
    RoleService,
    PermissionService,
  ],
})
export class AuthModule {}

@Module({
  imports: [TypeOrmModule.forFeature([Permission, PermissionCategory, Role])],
  controllers: [
    PermissionController,
    PermissionCategoryController,
    RoleController,
  ],
  providers: [PermissionService, PermissionCategoryService, RoleService],
})
export class Authv2Module {}
