import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
  WsResponse,
  OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets';
import { DatabaseService } from './database/database.service';
import { DatabaseEvent } from './events/database.event';
import { remove } from 'lodash';
import { OnModuleInit, Inject } from '@nestjs/common';
import { ObjectId } from 'bson';
import { JwtService } from '@nestjs/jwt';
import { Project, ProjectDocument } from './interfaces/project.interface';
import { Types, Model } from 'mongoose';

export class DatabaseSubscription {
  projectId: string;
  auth: string;
  token: string;
  collection: string;
  type: string;
  socket: any;
  id: string;


}

@WebSocketGateway({ path: '/subscriptions/database' })
export class DatabaseGateway implements OnGatewayDisconnect, OnModuleInit {

  constructor(private readonly databaseService: DatabaseService, private readonly jwtService: JwtService, @Inject('PROJECT_MODEL') private readonly projectModel: Model<ProjectDocument>) {
  }

  private subscriptions: Array<DatabaseSubscription> = [];

  @SubscribeMessage('subscribe')
  async subscribeDatabase(@ConnectedSocket() socket: any, @MessageBody() payload: DatabaseSubscription): Promise<WsResponse<DatabaseSubscription>> {
    let owner = 'anonymous';
    if (payload.token != null)
      if (await this.jwtService.verifyAsync(payload.token)) {
        owner = this.jwtService.decode(payload.token)['_id'];
      }
    payload.auth = owner;
    payload.socket = socket;
    payload.id = (new ObjectId()).toHexString();
    this.subscriptions.push(payload);
    const subscription = Object.assign({}, payload);
    subscription.socket = null;
    return { event: 'subscribe', data: subscription };
  }

  @SubscribeMessage('unsubscribe')
  unsubscribeDatabase(@ConnectedSocket()socket: any, @MessageBody() payload: DatabaseSubscription): WsResponse<DatabaseSubscription> {
    this.subscriptions.splice(this.subscriptions.indexOf(this.subscriptions.find(x => x.id == payload.id)), 1);
    return { event: 'unsubscribe', data: payload };
  }

  handleDisconnect(socket: any): any {
    this.subscriptions = remove(this.subscriptions, x => x.socket == socket);
  }

  onModuleInit(): any {
    this.databaseService.databaseGateway = this;
  }

  notify(event: DatabaseEvent) {
    this.subscriptions.forEach(async subscription => {
      // TODO implement auth validation
      try {
        const doc: any = event.payload;
        if (subscription.projectId == event.projectId && subscription.type.toString() == event.type.toString() && subscription.collection == event.collection) {
          const project = await this.projectModel.findOne({
            _id: Types.ObjectId(event.projectId),
          }).lean();
          if (project != null) {
            const schema = (project as any).databaseSchema.collections.find(x => x.name == event.collection);
            if (schema != null) {
              if (doc.acl.find(x => x.owner == subscription.auth).read)
                subscription.socket.emit('database', event);
            }
          }
        }
      } catch (err) {
        
      }
    });
  }

}
