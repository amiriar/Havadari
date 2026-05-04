import { notFoundTemplate } from '@common/messages/en/templates/errors/not-found.template';
import { CACHED_ROLES, ONE_HOUR_IN_MS } from '@common/utils/constants.utils';
import { getFlatPermissions } from '@common/utils/get-flat-permissions';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { EmailVerificationDto } from '../dto/email-verivication.dto';
import { LoginDto } from '../dto/login.dto';
import { PhoneVerificationDto } from '../dto/phone-verification.dto';
import { RegisterByEmailDto } from '../dto/register-by-email.dto';
import { RegisterByPhoneDto } from '../dto/register-by-phone.dto';
import { ForgetPassDto } from '../dto/forget-pass.dto';
import { SetNewPassDto } from '../dto/set-new-pass.dto';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { JwtPayload } from '../models/jwt-payload';
import { LoginResponse } from '../models/login-response';
import { OtpSentResponse } from '../models/otp-send-response';
import { JwtService } from './jwt-service';
import { OtpService } from './otp.service';
import { UserService } from './user.service';
import { RoleService } from './role.service';
import { AuthControllerCode } from '../constants/controller-codes';
import { HashingUtil } from '../utills/hasing-util';
import { UserCardService } from '@app/cards/services/user-card.service';
@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER)
    protected readonly cacheManager: Cache,
    @InjectRepository(User) private readonly repository: Repository<User>,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly rolesService: RoleService,
    private readonly configService: ConfigService,
    private readonly userCardService: UserCardService,
  ) {}

  /**
   *
   * @param LoginDto
   * @returns LoginResponse
   * @description login logic
   */
  async login(dto: LoginDto): Promise<LoginResponse> {
    //find user by login credentials
    const user: User = await this.repository.findOne({
      where: [
        { phoneNumber: dto.phoneNumber },
        { email: dto.email },
        { userName: dto.userName },
      ],
      select: ['email', 'phoneNumber', 'password', 'id', 'isPhoneVerified'],
      relations: ['roles', 'permissions'],
    });

    //when user not found
    if (!user)
      throw new UnauthorizedException({
        code: `${AuthControllerCode}01`,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'unauthorized',
      });

    //when phone-number is not verifed
    if (!user.isPhoneVerified)
      throw new UnauthorizedException({
        code: `${AuthControllerCode}02`,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'phone number is not verified',
      });

    //verify password
    const verified: boolean = await compare(dto.password, user.password);

    //throw unuthorized when password is incorrect
    if (!verified)
      throw new UnauthorizedException({
        code: `${AuthControllerCode}08`,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'unauthorized',
      });

    let roles: Role[] = await this.cacheManager.get(CACHED_ROLES);

    if (!roles) {
      roles = await this.rolesService.findAll();
      await this.cacheManager.set(CACHED_ROLES, roles, ONE_HOUR_IN_MS);
    }

    user.permissionsSet = getFlatPermissions(user, roles).map(
      (permission) => permission.name,
    );

    //cache loggedin user
    await this.cacheManager.set(user.id, user, ONE_HOUR_IN_MS);

    await this.userCardService.ensureStarterPack(user);

    //sign token
    return await this.jwtService.signToken(user.id);
  }

  /**
   * @param RegisterByEmailDto
   * @returns string
   * @description sends verificatoin code to email
   */
  async registerByEmail(dto: RegisterByEmailDto): Promise<string> {
    //create user
    await this.userService.create(dto);

    //generate ,save temporarily, and send OTP to email
    this.otpService.generateAndSend(dto.email);

    return `verification code sent to ${dto.email}`;
  }

  /**
   * @param RegisterByPhoneDto
   * @returns string
   * @description seds verification code to phone number
   */
  async registerByPhone(dto: RegisterByPhoneDto): Promise<OtpSentResponse> {
    //creat user
    await this.userService.create(dto);

    //generate ,save temporarily, and send OTP to phone number
    return await this.otpService.generateAndSend(dto.phoneNumber);
  }

  /**
   * @param EmailVerificationDto
   * @returns LoginResponse
   * @description verifies email and returns token
   */
  async verifyEmail(dto: EmailVerificationDto): Promise<LoginResponse> {
    const user: User = await this.repository.findOne({
      where: { email: dto.email },
    });

    if (!user)
      throw new UnauthorizedException({
        code: `${AuthControllerCode}03`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'User' }),
      });

    const verified: boolean = await this.otpService.verify(dto.otp, dto.email);

    if (!verified) {
      throw new UnauthorizedException({
        code: `${AuthControllerCode}06`,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'unauthorized',
      });
    }

    await this.repository.update({ id: user.id }, { isEmailVerified: true });
    await this.userCardService.ensureStarterPack(user);

    //sign token
    return await this.jwtService.signToken(user.id);
  }

  /**
   * @param PhoneVerificationDto
   * @returns LoginResponse
   * @description verifies phone number and returns token
   */
  async verifyPhone(dto: PhoneVerificationDto): Promise<LoginResponse> {
    const user: User = await this.repository.findOne({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user)
      throw new NotFoundException({
        code: `${AuthControllerCode}03`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'User' }),
      });

    const verified: boolean = await this.otpService.verify(
      dto.otp,
      dto.phoneNumber,
    );

    if (!verified) {
      throw new UnauthorizedException({
        code: `${AuthControllerCode}06`,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'unauthorized',
      });
    }

    await this.repository.update({ id: user.id }, { isPhoneVerified: true });
    await this.userCardService.ensureStarterPack(user);

    //sign token
    return await this.jwtService.signToken(user.id);
  }

  /**
   * @param PhoneVerificationDto
   * @returns LoginResponse
   * @description recives refresh token and ruturns access token
   */
  async refreshToken(token: string): Promise<LoginResponse> {
    const payload: JwtPayload = await this.jwtService.verifyRefreshToken(token);

    const user: User = await this.repository.findOne({
      where: { id: payload.sub },
      select: ['email', 'phoneNumber', 'password', 'id', 'isPhoneVerified'],
      relations: ['roles', 'permissions'],
    });

    if (!user) {
      throw new UnauthorizedException({
        code: `${AuthControllerCode}03`,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'unauthorized',
      });
    }

    let roles: Role[] = await this.cacheManager.get(CACHED_ROLES);

    if (!roles) {
      roles = await this.rolesService.findAll();
      await this.cacheManager.set(CACHED_ROLES, roles, ONE_HOUR_IN_MS);
    }

    user.permissionsSet = getFlatPermissions(user, roles).map(
      (permission) => permission.name,
    );

    //cache loggedin user
    await this.cacheManager.set(user.id, user, ONE_HOUR_IN_MS);

    const accessToken: string = await this.jwtService.signAccessToken(user.id);

    return {
      accessToken,
    };
  }

  async resendOtp(phoneNumber: string) {
    const user = await this.repository.findOne({
      where: { phoneNumber },
      select: ['id'],
    });

    if (!user) {
      await this.userService.create({ phoneNumber });
    }

    return await this.otpService.generateAndSend(phoneNumber);
  }

  /**
   * @param ForgetPassDto
   * @returns OtpSentResponse
   * @description sends OTP to phone for password reset
   */
  async forgetPass(dto: ForgetPassDto): Promise<OtpSentResponse> {
    const isPhoneRegistered: boolean = await this.userService.isPhoneRegistered(
      dto.phone,
    );
    if (!isPhoneRegistered) {
      throw new NotFoundException({
        code: `${AuthControllerCode}03`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'User' }),
      });
    }
    return await this.otpService.generateAndSend(dto.phone);
  }

  /**
   * @param SetNewPassDto
   * @returns string
   * @description verifies OTP and sets new password
   */
  async setNewPass(dto: SetNewPassDto): Promise<string> {
    const user: User = await this.repository.findOne({
      where: { phoneNumber: dto.phone },
    });

    if (!user) {
      throw new NotFoundException({
        code: `${AuthControllerCode}03`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'User' }),
      });
    }

    const verified: boolean = await this.otpService.verify(dto.otp, dto.phone);

    if (!verified) {
      throw new UnauthorizedException({
        code: `${AuthControllerCode}06`,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'unauthorized',
      });
    }

    // Hash the new password
    const hashedPassword: string = await HashingUtil.hash(dto.new_pass);

    // Update user password
    await this.repository.update({ id: user.id }, { password: hashedPassword });

    return 'Password updated successfully';
  }

  async authenticate(authToken: string): Promise<User> {
    if (!authToken)
      throw new UnauthorizedException({
        code: `${AuthControllerCode}09`,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'unauthorized',
      });

    const payload: JwtPayload = this.jwtService.verifyAccessToken(authToken);

    let user: User = await this.cacheManager.get(payload.sub);

    try {
      if (!user) {
        user = await this.repository.findOne({
          where: { id: payload.sub },
          select: ['id', 'isEmailVerified', 'isPhoneVerified'],
          relations: ['roles', 'permissions'],
        });

        let roles: Role[] = await this.cacheManager.get(CACHED_ROLES);

        if (!roles) {
          roles = await this.rolesService.findAll();
          await this.cacheManager.set(CACHED_ROLES, roles, ONE_HOUR_IN_MS);
        }

        user.permissionsSet = getFlatPermissions(user, roles).map(
          (permission) => permission.name,
        );

        await this.cacheManager.set(user.id, user, ONE_HOUR_IN_MS);
      }
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException({
        code: `${AuthControllerCode}10`,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'unauthorized',
      });
    }

    if (!user) {
      throw new UnauthorizedException({
        code: `${AuthControllerCode}01`,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'unauthorized',
      });
    }

    if (!(user.isEmailVerified || user.isPhoneVerified)) {
      throw new UnauthorizedException({
        code: `${AuthControllerCode}04`,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'please verify your email or phoneNumber',
      });
    }
    return user;
  }
}
