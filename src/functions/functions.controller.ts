import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { FunctionsService } from './functions.service';

@Controller(':projectId')
export class FunctionsController {

  constructor(private readonly functionsService: FunctionsService) {
  }

  @Get('functions/:name')
  @Post('functions/:name')
  async run(@Param('projectId') projectId: string, @Param('name') name: string, @Body() body: any) {
    return await this.functionsService.run(projectId, name, {
      body,
    });
  }

  @Get('jobs/:name')
  @Post('jobs/:name')
  async runJob(@Param('projectId') projectId: string, @Param('name') name: string, @Body() body: any) {
    return await this.functionsService.runJob(projectId, name, {
      body,
    });
  }

}
