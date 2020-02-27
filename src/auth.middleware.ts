import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
  ) {
  }

  use(req: any, res: any, next: () => void) {
    if (!req.headers.hasOwnProperty('authorization')) throw new ForbiddenException();
    if (this.jwtService.verify(req.headers['authorization'].replace('Bearer ', ''))) {
      req.user = this.jwtService.decode(req.headers['authorization'].replace('Bearer ', ''));
    }
    next();
  }
}
