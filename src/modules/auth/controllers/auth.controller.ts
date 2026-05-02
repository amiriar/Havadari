import { IsPublic } from '@common/decorators/is-public.decorator';
import { Body, Controller, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmailVerificationDto } from '../dto/email-verivication.dto';
import { LoginDto } from '../dto/login.dto';
import { PhoneVerificationDto } from '../dto/phone-verification.dto';
import { RegisterByEmailDto } from '../dto/register-by-email.dto';
import { RegisterByPhoneDto } from '../dto/register-by-phone.dto';
import { sendVerificationCodeDto } from '../dto/send-verification.dto';
import { ForgetPassDto } from '../dto/forget-pass.dto';
import { SetNewPassDto } from '../dto/set-new-pass.dto';
import { HashPasswordPipe } from '../pipes/hash-password.pipe';
import { AuthService } from '../services/auth.service';

@IsPublic()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Post('register-by-email')
  async registerByEmail(@Body(HashPasswordPipe) dto: RegisterByEmailDto) {
    return await this.authService.registerByEmail(dto);
  }

  @Post('register-by-phone')
  async registerByPhone(@Body() dto: RegisterByPhoneDto) {
    return await this.authService.registerByPhone(dto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: EmailVerificationDto) {
    return await this.authService.verifyEmail(dto);
  }

  @Post('verify-phone')
  async verifyPhone(@Body() dto: PhoneVerificationDto) {
    return await this.authService.verifyPhone(dto);
  }

  @Post('phone/send-otp')
  async sendPhoneOtp(@Body() dto: sendVerificationCodeDto) {
    return await this.authService.resendOtp(dto.phoneNumber);
  }

  @Post('phone/verify')
  async verifyPhoneOtp(@Body() dto: PhoneVerificationDto) {
    return await this.authService.verifyPhone(dto);
  }

  @Post('resend-verification-code')
  async sendVerificationCode(@Body() dto: sendVerificationCodeDto) {
    return await this.authService.resendOtp(dto.phoneNumber);
  }

  @Post('refresh-token')
  async refreshToken(@Body('refresh-token') token: string) {
    return await this.authService.refreshToken(token);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') token: string) {
    return await this.authService.refreshToken(token);
  }

  @Post('forget-pass')
  async forgetPass(@Body() dto: ForgetPassDto) {
    return await this.authService.forgetPass(dto);
  }

  @Put('set-new-pass')
  async setNewPass(@Body() dto: SetNewPassDto) {
    return await this.authService.setNewPass(dto);
  }
}
