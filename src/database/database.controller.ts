import { Body, Controller, Delete, Get, Param, Post, Put, Req, Inject, NotFoundException } from '@nestjs/common';
import { ObjectDocument } from './document.interface';
import { DatabaseService } from './database.service';
import { ApiBody, ApiProperty, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Project, ProjectDocument } from '../interfaces/project.interface';
import { Model, Types } from 'mongoose';

@Controller(':projectId/database')
@ApiHeader({
  name: 'X-MASTER-KEY',
  description: 'Project master key',
})
export class DatabaseController {

  constructor(private readonly databaseService: DatabaseService, private readonly jwtService: JwtService, @Inject('PROJECT_MODEL') private readonly projectModel: Model<ProjectDocument>) {
  }

  private async getOwner(req: any, project: Project) {
    let owner = 'anonymous';
    if (req.headers.hasOwnProperty('authorization')) {
      if (await this.jwtService.verifyAsync(req.headers['authorization'].replace('Bearer ', ''))) {
        owner = this.jwtService.decode(req.headers['authorization'].replace('Bearer ', ''))['_id'];
      }
    }
    if (owner == 'root') owner = 'anonymous';
    if (req.headers.hasOwnProperty('x-master-key') && req.headers['x-master-key'] == project.masterKey) {
      owner = 'root';
    }
    return owner;
  }

  private async getProject(projectId: string): Promise<Project> {
    const project: Project = await this.projectModel.findOne({
      _id: Types.ObjectId(projectId),
    }).lean();
    if (project == null) throw new NotFoundException();
    return project;
  }

  @Get(':collection')
  @ApiBearerAuth()
  async index(@Req() req: any, @Param('projectId') projectId: string, @Param('collection') collection: string): Promise<Array<ObjectDocument>> {
    return this.databaseService.index(collection, {}, projectId, await this.getOwner(req, await this.getProject(projectId)));
  }

  @Post(':collection')
  @ApiBody({ type: [ObjectDocument] })
  async insert(@Param('projectId') projectId: string, @Param('collection') collection: string, @Body() documents: [ObjectDocument]): Promise<Array<ObjectDocument>> {
    return this.databaseService.insert(collection, documents, projectId);
  }

  @Put(':collection')
  @ApiBody({ type: [ObjectDocument] })
  async update(@Req() req: any, @Param('projectId') projectId: string, @Param('collection') collection: string, @Body() documents: [ObjectDocument]): Promise<Array<ObjectDocument>> {
    return this.databaseService.update(collection, documents, projectId, await this.getOwner(req, await this.getProject(projectId)));
  }

  @Delete(':collection')
  @ApiBody({ type: [ObjectDocument] })
  async delete(@Req() req: any, @Param('projectId') projectId: string, @Param('collection') collection: string, @Body() documents: [ObjectDocument]): Promise<Array<ObjectDocument>> {
    return this.databaseService.delete(collection, documents, projectId, await this.getOwner(req, await this.getProject(projectId)));
  }

}
