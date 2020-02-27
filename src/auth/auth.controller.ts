import { Body, Controller, Post } from '@nestjs/common';
import { Admin, AdminDocument } from '../interfaces/admin.interface';
import { AuthService } from './auth.service';

@Controller('admin/auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {
  }

  @Post('user')
  async register(@Body() admin: Admin): Promise<{ token: string }> {
    return await this.authService.register(admin as AdminDocument);
  }

  @Post('session')
  async login(@Body() admin: Admin): Promise<{ token: string }> {
    return await this.authService.login(admin as AdminDocument);
  }

}
