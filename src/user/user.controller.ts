import { Controller, Post, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBody, ApiProperty } from '@nestjs/swagger';

export class AccessTokenPayload {
  @ApiProperty()
  accessToken: string;
}

@Controller(':projectId/auth')
export class UserController {

  constructor(private readonly userService: UserService) {
  }

  @Post('facebook')
  @ApiBody({ type: AccessTokenPayload })
  async loginWithFacebook(@Param('projectId') projectId: string, @Body() payload: { accessToken: string }): Promise<{ token: string }> {
    return await this.userService.loginWithFacebook(projectId, payload.accessToken);
  }

}
