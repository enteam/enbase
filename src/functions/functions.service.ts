import { Injectable, NotFoundException, Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { DeploymentsService } from '../deployments/deployments.service';
import { DatabaseService } from '../database/database.service';
import { ProjectService } from '../project/project.service';
import { Project, ProjectDocument } from '../interfaces/project.interface';
import { Model, Types, Document } from 'mongoose';

@Injectable()
export class FunctionsService implements OnModuleInit {

  constructor(
    @Inject(forwardRef(() => DatabaseService))
    private readonly databaseService: DatabaseService,
    @Inject('PROJECT_MODEL') private readonly projectModel: Model<ProjectDocument>) {
  }

  async run(projectId: string, name: string, context: any): Promise<any> {
    const instance = DeploymentsService.instances.find(x => x.projectId == projectId && x.name == name && x.type == 'function');
    if (instance == null) throw new NotFoundException();
    return await instance.handler(this.extendContext(projectId, context));
  }

  public extendContext(projectId: string, context) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      ...context, ...{
        database: {
          ref(collection: string) {
            return {
              async find(query) {
                return await self.databaseService.index(collection, query, projectId, 'root');
              },
              async insert(documents) {
                return await self.databaseService.insert(collection, documents, projectId, 'root');
              },
              async update(documents) {
                return await self.databaseService.update(collection, documents, projectId, 'root');
              },
              async delete(documents) {
                return await self.databaseService.delete(collection, documents, projectId, 'root');
              },
            };
          },
        },
      },
    };
  }

  async runJob(projectId: string, name: string, context: any) {
    const project: Project & Document = await this.projectModel.findOne({ _id: Types.ObjectId(projectId) });
    if (project == null) throw new NotFoundException();
    if (!project.databaseSchema.collections.some(x => x.name == 'jobs'))
      await this.projectModel.updateOne({ _id: Types.ObjectId(projectId) }, {
        '$push': {
          'databaseSchema.collections': {
            name: 'jobs',
            fields: [
              {
                name: 'status',
                required: true,
                publicWriteAccess: false,
                publicReadAccess: false,
                publicUpdateAccess: false,
                publicDeleteAccess: false,
                type: 'string',
              },
              {
                name: 'name',
                required: true,
                publicWriteAccess: false,
                publicReadAccess: false,
                publicUpdateAccess: false,
                publicDeleteAccess: false,
                type: 'string',
              },
              {
                name: 'payloadJson',
                required: true,
                publicWriteAccess: false,
                publicReadAccess: false,
                publicUpdateAccess: false,
                publicDeleteAccess: false,
                type: 'string',
              },
              {
                name: 'createdAt',
                required: true,
                publicWriteAccess: false,
                publicReadAccess: false,
                publicUpdateAccess: false,
                publicDeleteAccess: false,
                type: 'number',
              },
              {
                name: 'startedAt',
                required: true,
                publicWriteAccess: false,
                publicReadAccess: false,
                publicUpdateAccess: false,
                publicDeleteAccess: false,
                type: 'number',
              },
              {
                name: 'finishedAt',
                required: true,
                publicWriteAccess: false,
                publicReadAccess: false,
                publicUpdateAccess: false,
                publicDeleteAccess: false,
                type: 'number',
              },
              {
                name: 'logs',
                required: true,
                publicWriteAccess: false,
                publicReadAccess: false,
                publicUpdateAccess: false,
                publicDeleteAccess: false,
                type: 'string',
              },
            ],
          },
        },
      });
    const out = await this.databaseService.insert('jobs', [
      {
        status: 'pending',
        name,
        payloadJson: JSON.stringify(context),
        acl: [],
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        createdAt: (new Date()).getTime() / 1000,
        logs: '',
      },
    ], projectId, 'root');
    return out[0];
  }

  async checkForJobs() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    for (const project of await self.projectModel.find().lean()) {
      const jobs: Array<any> = await self.databaseService.index('jobs', {
        status: 'pending',
      }, project._id.toHexString(), 'root');
      for (const job of jobs) {
        job.status = 'running';
        job.startedAt = (new Date()).getTime() / 1000;
        await self.databaseService.update('jobs', [job], project._id.toHexString(), 'root');
        const instance = DeploymentsService.instances.find(x => x.projectId == project._id.toHexString() && x.name == job.name && x.type == 'job');
        if (instance == null) throw new NotFoundException();
        let value = instance.handler({
          ...self.extendContext(project._id.toHexString(), JSON.parse(job.payloadJson)),
          ...{
            async success(message) {
              job.logs += message + '\n';
              job.status = 'success';
              job.finishedAt = (new Date()).getTime() / 1000;
              await self.databaseService.update('jobs', [job], project._id.toHexString(), 'root');
            },
            async fail(message) {
              job.logs += message + '\n';
              job.status = 'failed';
              job.finishedAt = (new Date()).getTime() / 1000;
              await self.databaseService.update('jobs', [job], project._id.toHexString(), 'root');
            },
            async log(message) {
              job.logs += message + '\n';
              await self.databaseService.update('jobs', [job], project._id.toHexString(), 'root');
            },
          },
        });
        if (!(value instanceof Promise)) value = new Promise(resolve => resolve(value));
        value.then(async () => {
          if (job.status != 'success' && job.status != 'failed') {
            job.status = 'success';
            job.finishedAt = (new Date()).getTime() / 1000;
            await self.databaseService.update('jobs', [job], project._id.toHexString(), 'root');
          }
        }).catch(async () => {
          if (job.status != 'success' && job.status != 'failed') {
            job.status = 'failed';
            job.finishedAt = (new Date()).getTime() / 1000;
            await self.databaseService.update('jobs', [job], project._id.toHexString(), 'root');
          }
        });
      }
    }
  }

  onModuleInit(): any {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setInterval(() => this.checkForJobs().catch((err) => {
      console.log(err);
    }), 1000);
  }

}
