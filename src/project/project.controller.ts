import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from '../interfaces/project.interface';
import { ApiBearerAuth } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

@Controller('admin/projects')
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService, private readonly databaseService: DatabaseService) {
  }

  @Get()
  async index(@Req() req: any) {
    return this.projectService.index(req.user);
  }

  @Post()
  async create(@Req() req: any, @Body() project: Project) {
    return this.projectService.create(req.user, project);
  }

  @Put(':id')
  @Patch(':id')
  async edit(@Req() req: any, @Body() project: Project, @Param('id') id: string) {
    return this.projectService.edit(req.user, project, id);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.projectService.remove(req.user, id);
  }

  @Get(':id/jobs')
  async indexJobs(@Param('id') id: string) {
    return this.databaseService.index('jobs', {}, id, 'root');
  }
}
