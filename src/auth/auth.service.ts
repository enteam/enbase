import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from '../interfaces/admin.interface';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @Inject('ADMIN_MODEL')
    private readonly adminModel: Model<AdminDocument>,
    private readonly jwtService: JwtService,
  ) {
  }

  async register(admin: Admin): Promise<{ token: string }> {
    if (await this.adminModel.countDocuments({ email: admin.email }) > 0) {
      throw new ForbiddenException('admin with given email already exists');
    }
    admin.passwordHash = await bcrypt.hash(admin.password, await bcrypt.genSalt(10));
    admin = (await this.adminModel.insertMany([
      admin,
    ]))[0];
    admin.passwordHash = null;
    return {
      token: await this.jwtService.signAsync((admin as AdminDocument).toJSON()),
    };
  }

  async login(credentials: AdminDocument): Promise<{ token: string }> {
    if (await this.adminModel.countDocuments({ email: credentials.email }) == 0) throw new ForbiddenException('given credentials are invalid');
    const admin = await this.adminModel.findOne({ email: credentials.email });
    if (!await bcrypt.compare(credentials.password, admin.passwordHash)) throw new ForbiddenException('given credentials are invalid');
    admin.passwordHash = null;
    return {
      token: await this.jwtService.signAsync((admin as AdminDocument).toJSON()),
    };
  }
}
