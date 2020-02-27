import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import FB from 'fb';
import { ObjectID } from 'bson';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService, private readonly jwtService: JwtService) {
  }

  async loginWithFacebook(projectId: string, accessToken: string): Promise<{ token: string }> {
    try {
      FB.setAccessToken(accessToken);
      const profile = await FB.api('me?fields=id,name,email');
      const id = new ObjectID();
      if ((await this.databaseService.index('users', {
        facebookUserId: profile.id,
      }, projectId, 'root')).length == 0) {
        const users = await this.databaseService.insert('users', [{
          _id: Types.ObjectId(id.toHexString()),
          facebookUserId: profile.id,
          name: profile.name,
          email: profile.email,
          acl: [
            {
              owner: id.toHexString(),
              read: true,
              update: true,
              delete: true,
            },
          ],
        }], projectId);
        return {
          token: await this.jwtService.signAsync(users[0]),
        };
      } else {
        const users = (await this.databaseService.index('users', {
          facebookUserId: profile.id,
        }, projectId, 'root'));
        return {
          token: await this.jwtService.signAsync(users[0]),
        };
      }
    } catch (err) {
      throw new ForbiddenException();
    }
  }
}
