import { Injectable, NotFoundException } from '@nestjs/common';
import { DeploymentsService } from '../deployments/deployments.service';

@Injectable()
export class FunctionsService {

  async run(projectId: string, name: string, context: any): Promise<any> {
    const instance = DeploymentsService.instances.find(x => x.projectId == projectId && x.name == name);
    if (instance == null) throw new NotFoundException();
    return await instance.handler(context);
  }

}
