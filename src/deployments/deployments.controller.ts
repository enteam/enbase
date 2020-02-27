import { Controller, Post, UseInterceptors, UploadedFile, Req, Param, Get } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Deployment, DeploymentInstance, DeploymentRequest } from '../interfaces/deployment.interface';
import { ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('admin/projects/:projectId/deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {
  }

  @Post()
  @UseInterceptors(FileInterceptor('code'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Code archive',
    type: DeploymentRequest,
  })
  async deploy(@UploadedFile() code, @Req() req: any, @Param('projectId') projectId: string): Promise<Deployment> {
    return this.deploymentsService.deploy(req.user, projectId, code);
  }

  @Get()
  async index(@Req() req: any, @Param('projectId') projectId: string): Promise<Array<Deployment>> {
    return this.deploymentsService.index(req.user, projectId);
  }

  @Get('functions')
  async indexFunctions(@Req() req: any, @Param('projectId') projectId: string): Promise<Array<DeploymentInstance>> {
    return DeploymentsService.instances.filter(x => x.projectId == projectId);
  }
}
