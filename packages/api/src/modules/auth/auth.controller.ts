import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest } from '../../common/types/request.types';
import { Throttle, AUTH_THROTTLE } from '../../common/rate-limit/throttle.decorator';
import {
  RegisterDto,
  VerifyOtpDto,
  LoginDto,
  CompleteProfileDto,
  RefreshTokenDto,
  SupabaseLoginDto,
  GoogleLoginDto,
  RegisterPasswordDto,
  LoginPasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  completeProfileSchema,
  refreshTokenSchema,
  supabaseLoginSchema,
  googleLoginSchema,
  registerPasswordSchema,
  loginPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Password auth — parity with the web local-auth fallback so the
  // same-origin proxy never 404s when a backend origin IS configured.
  @Post('register-password')
  @Throttle(AUTH_THROTTLE)
  registerPassword(@Body(new ZodValidationPipe(registerPasswordSchema)) dto: RegisterPasswordDto) {
    return this.authService.registerWithPassword(dto);
  }

  @Post('login-password')
  @Throttle(AUTH_THROTTLE)
  loginPassword(@Body(new ZodValidationPipe(loginPasswordSchema)) dto: LoginPasswordDto) {
    return this.authService.loginWithPassword(dto);
  }

  @Post('forgot-password')
  @Throttle(AUTH_THROTTLE)
  forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Throttle(AUTH_THROTTLE)
  resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordDto) {
    return this.authService.resetPasswordWithToken(dto.token, dto.password);
  }

  @Post('verify-otp')
  @Throttle(AUTH_THROTTLE)
  verifyOtp(@Body(new ZodValidationPipe(verifyOtpSchema)) dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('complete-profile')
  @Throttle(AUTH_THROTTLE)
  completeProfile(@Body(new ZodValidationPipe(completeProfileSchema)) dto: CompleteProfileDto) {
    return this.authService.completeProfile(dto);
  }

  @Post('refresh')
  @Throttle(AUTH_THROTTLE)
  refresh(@Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('supabase')
  @Throttle(AUTH_THROTTLE)
  supabase(@Body(new ZodValidationPipe(supabaseLoginSchema)) dto: SupabaseLoginDto) {
    return this.authService.exchangeSupabaseToken(dto);
  }

  @Post('google')
  @Throttle(AUTH_THROTTLE)
  google(@Body(new ZodValidationPipe(googleLoginSchema)) dto: GoogleLoginDto) {
    return this.authService.exchangeGoogleToken(dto);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  logout(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.sub);
  }
}
