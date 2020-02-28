import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export class HookInstance {
  handler: any;
  projectId: string;
  event: string;
  collection: string;
  deploymentId: string;


  constructor(handler: any, projectId: string, event: string, collection: string, deploymentId: string) {
    this.handler = handler;
    this.projectId = projectId;
    this.event = event;
    this.collection = collection;
    this.deploymentId = deploymentId;
  }
}

export class DeploymentInstance {
  handler: any;
  projectId: string;
  name: string;
  type: string;
  deploymentId: string;
}

export class DeploymentRequest {
  @ApiProperty({ type: 'string', format: 'binary' })
  code: any;
}

export class Deployment {
  projectId: string;
  logs: string;
  startTime: Date;
  finishTime: Date;
  status: string;
  archive: string;
}

export class DeploymentDocument extends Document implements Deployment {
  finishTime: Date;
  logs: string;
  projectId: string;
  startTime: Date;
  status: string;
  archive: string;
}