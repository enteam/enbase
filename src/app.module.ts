import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { databaseProviders } from './database.provider';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AdminSchema } from './schemas/admin.schema';
import { AuthMiddleware } from './auth.middleware';
import { ProjectSchema } from './schemas/project.schema';
import { ProjectService } from './project/project.service';
import { ProjectController } from './project/project.controller';
import { DatabaseService } from './database/database.service';
import { DatabaseController } from './database/database.controller';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { DeploymentsService } from './deployments/deployments.service';
import { DeploymentsController } from './deployments/deployments.controller';
import { DeploymentSchema } from './schemas/deployment.schema';
import { FunctionsService } from './functions/functions.service';
import { FunctionsController } from './functions/functions.controller';
import { DatabaseGateway } from './database.gateway';

@Module({
  imports: [ConfigModule.forRoot(), JwtModule.register({ secret: 'hard!to-guess_secret' })],
  controllers: [AppController, AuthController, ProjectController, DatabaseController, UserController, DeploymentsController, FunctionsController],
  providers: [AppService, ...databaseProviders, AuthService, {
    provide: 'ADMIN_MODEL',
    useFactory: (connection) => connection.model('Admin', AdminSchema),
    inject: ['DATABASE_CONNECTION'],
  }, {
    provide: 'PROJECT_MODEL',
    useFactory: (connection) => connection.model('Project', ProjectSchema),
    inject: ['DATABASE_CONNECTION'],
  }, {
    provide: 'DEPLOYMENT_MODEL',
    useFactory: (connection) => connection.model('Deployment', DeploymentSchema),
    inject: ['DATABASE_CONNECTION'],
  }, ProjectService, DatabaseService, UserService, DeploymentsService, FunctionsService, DatabaseGateway],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('admin/projects');
  }
}