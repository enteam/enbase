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
import { OnModuleInit } from '@nestjs/common';
import { ObjectId } from 'bson';

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
export class DatabaseGateway implements OnGatewayDisconnect, OnModuleInit, OnGatewayConnection {

  constructor(private readonly databaseService: DatabaseService) {
  }

  private subscriptions: Array<DatabaseSubscription> = [];

  @SubscribeMessage('subscribe')
  async subscribeDatabase(@ConnectedSocket() socket: any, @MessageBody() payload: DatabaseSubscription): WsResponse<DatabaseSubscription> {
    let owner = 'anonymous';
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
    this.subscriptions.forEach(subscription => {
      // TODO implement auth validation
      if (subscription.projectId == event.projectId && subscription.type.toString() == event.type.toString() && subscription.collection == event.collection) {
        subscription.socket.emit('database', event);
      }
    });
  }

  handleConnection(client: any, ...args: any[]): any {
    console.log('connected');
  }
}
