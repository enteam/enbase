import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { FunctionsService } from './functions.service';

@Controller(':projectId/functions')
export class FunctionsController {

  constructor(private readonly functionsService: FunctionsService) {
  }

  @Get(':name')
  @Post(':name')
  async run(@Param('projectId') projectId: string, @Param('name') name: string, @Body() body: any) {
    return await this.functionsService.run(projectId, name, {
      body,
    });
  }

}
