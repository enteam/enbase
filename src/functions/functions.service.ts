import { Injectable, NotFoundException } from '@nestjs/common';
import { DeploymentsService } from '../deployments/deployments.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class FunctionsService {

  constructor(private readonly databaseService: DatabaseService) {
  }

  async run(projectId: string, name: string, context: any): Promise<any> {
    const instance = DeploymentsService.instances.find(x => x.projectId == projectId && x.name == name);
    if (instance == null) throw new NotFoundException();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return await instance.handler({
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
    });
  }

}
