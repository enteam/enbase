import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Model, Mongoose, Types } from 'mongoose';
import { Project, ProjectDocument } from '../interfaces/project.interface';
import { validate } from 'class-validator';
import { ObjectDocument } from './document.interface';
import * as _ from 'lodash';
import * as PubSub from 'node-redis-pubsub';
import { DatabaseEvent } from '../events/database.event';
import { ObjectId } from 'bson';
import { DatabaseGateway } from '../database.gateway';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(@Inject('DATABASE_CONNECTION') private readonly connection: Mongoose, @Inject('PROJECT_MODEL') private readonly projectModel: Model<ProjectDocument>) {
  }

  private messenger: any;
  public databaseGateway: DatabaseGateway;

  onModuleInit() {
    this.messenger = PubSub({
      url: process.env.REDIS_URI,
    });
    this.messenger.on('database_event', (data: DatabaseEvent, channel) => {
      this.onDatabaseEvent(data);
    });
  }

  async onDatabaseEvent(event: DatabaseEvent) {
    this.databaseGateway.notify(event);
  }

  async index(collection: string, query: any, projectId: string, auth: string): Promise<Array<ObjectDocument>> {
    const iterator = await this.connection.connection.useDb(projectId).collection(collection).find(query);
    const schema = (await this.getProject(projectId)).databaseSchema.collections.find(x => x.name == collection);
    if (schema == null) throw new NotFoundException('collection not found');
    if (auth != 'root' && !schema.publicReadAccess) throw new ForbiddenException('public read is denied');
    let doc: ObjectDocument = await iterator.next();
    const documents: Array<ObjectDocument> = [];
    while (doc != null) {
      try {
        if (auth != 'root') {
          if (doc.acl.find(x => x.owner == auth).read) documents.push(doc);
        } else {
          documents.push(doc);
        }
      } catch (err) {

      }
      doc = await iterator.next();
    }
    return documents;
  }

  async insert(collection: string, documents: [any], projectId: string, auth?: string): Promise<Array<ObjectDocument>> {
    const schema = (await this.getProject(projectId)).databaseSchema.collections.find(x => x.name == collection);
    if (schema == null) throw new NotFoundException('collection not found');
    if (auth == 'root' || schema.publicWriteAccess) {
      let valid = true;
      const insertables = [];
      for (const document of documents) {
        const classDocument = new ObjectDocument() as ObjectDocument & { [key: string]: string };
        classDocument['acl'] = document['acl'];
        for (const field of schema.fields) {
          classDocument[field.name] = '';
        }
        document._id = new ObjectId();
        const insertable = _.pick(document, ['acl', ...schema.fields.map(x => x.name), '_id']);
        for (const field of schema.fields) {
          if (field.required && !insertable.hasOwnProperty(field.name)) insertable[field.name] = '';
          if (typeof insertable[field.name] === 'object') insertable[field.name] = '';
          if (typeof insertable[field.name] !== field.type) insertable[field.name] = '';
        }
        this.messenger.emit('database_event', new DatabaseEvent(projectId, (new Date()).getTime() / 1000, 'INSERT', insertable, collection));
        insertables.push(insertable);
        if ((await validate(classDocument)).length > 0) valid = false;
      }
      if (!valid) throw new BadRequestException('object is invalid');
      return (await this.connection.connection.useDb(projectId).collection(collection).insertMany(insertables, {
        forceServerObjectId: false,
      })).ops;
    } else {
      throw new ForbiddenException('public write is denied');
    }
  }

  async update(collection: string, documents: [any], projectId: string, auth: string): Promise<Array<ObjectDocument>> {
    const schema = (await this.getProject(projectId)).databaseSchema.collections.find(x => x.name == collection);
    if (schema == null) throw new NotFoundException('collection not found');
    if (auth == 'root' || schema.publicUpdateAccess) {
      let valid = true;
      const insertables = [];
      for (const document of documents) {
        const classDocument = new ObjectDocument() as ObjectDocument & { [key: string]: string };
        classDocument['acl'] = (await this.connection.connection.useDb(projectId).collection(collection).findOne({ _id: Types.ObjectId(document._id) }))['acl'];
        if (auth == 'root' || classDocument.acl.find(x => x.owner == auth).update) {
          for (const field of schema.fields) {
            classDocument[field.name] = '';
          }
          const insertable = _.pick(document, ['acl', ...schema.fields.map(x => x.name)]);
          for (const field of schema.fields) {
            if (field.required && !insertable.hasOwnProperty(field.name)) insertable[field.name] = '';
            if (typeof insertable[field.name] === 'object') insertable[field.name] = '';
            if (typeof insertable[field.name] !== field.type) insertable[field.name] = '';
          }
          insertable._id = document._id;
          this.messenger.emit('database_event', new DatabaseEvent(projectId, (new Date()).getTime() / 1000, 'UPDATE', insertable, collection));
          insertables.push(insertable);
          if ((await validate(classDocument)).length > 0) valid = false;
        }
      }
      if (!valid) throw new BadRequestException('object is invalid');
      const output = [];
      for (const insertable of insertables) {
        (await this.connection.connection.useDb(projectId).collection(collection).updateOne({
          _id: Types.ObjectId(insertable._id),
        }, { $set: _.omit(insertable, ['_id']) }));
        output.push(insertable);
      }
      return output;
    } else {
      throw new ForbiddenException('public update is denied');
    }
  }

  async delete(collection: string, documents: [any], projectId: string, auth: string): Promise<Array<ObjectDocument>> {
    const schema = (await this.getProject(projectId)).databaseSchema.collections.find(x => x.name == collection);
    if (schema == null) throw new NotFoundException('collection not found');
    if (auth == 'root' || schema.publicDeleteAccess) {
      const insertables = [];
      for (const document of documents) {
        const classDocument = new ObjectDocument() as ObjectDocument & { [key: string]: string };
        classDocument['acl'] = document['acl'];
        if (auth == 'root' || classDocument.acl.find(x => x.owner == auth).delete) insertables.push(document);
      }
      const output = [];
      for (const insertable of insertables) {
        this.messenger.emit('database_event', new DatabaseEvent(projectId, (new Date()).getTime() / 1000, 'DELETE', insertable, collection));
        (await this.connection.connection.useDb(projectId).collection(collection).deleteOne({
          _id: Types.ObjectId(insertable._id),
        }));
        output.push(insertable);
      }
      return output;
    } else {
      throw new ForbiddenException('public delete is denied');
    }
  }

  private async getProject(projectId: string): Promise<Project> {
    const project = this.projectModel.findOne({
      _id: Types.ObjectId(projectId),
    });
    if (project == null) throw new NotFoundException('project not found');
    return project;
  }
}
