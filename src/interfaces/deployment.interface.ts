import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export class DeploymentInstance {
  handler: any;
  projectId: string;
  name: string;
  type: string;
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