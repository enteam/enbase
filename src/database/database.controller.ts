import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ObjectDocument } from './document.interface';
import { DatabaseService } from './database.service';
import { ApiBody, ApiProperty, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';

@Controller(':projectId/database')
export class DatabaseController {

  constructor(private readonly databaseService: DatabaseService, private readonly jwtService: JwtService) {
  }

  private async getOwner(req: any) {
    let owner = 'anonymous';
    if (req.headers.hasOwnProperty('authorization')) {
      if (await this.jwtService.verifyAsync(req.headers['authorization'].replace('Bearer ', ''))) {
        owner = this.jwtService.decode(req.headers['authorization'].replace('Bearer ', ''))['_id'];
      }
    }
    if (owner == 'root') owner = 'anonymous';
    return owner;
  }

  @Get(':collection')
  @ApiBearerAuth()
  async index(@Req() req: any, @Param('projectId') projectId: string, @Param('collection') collection: string): Promise<Array<ObjectDocument>> {
    return this.databaseService.index(collection, {}, projectId, this.getOwner(req));
  }

  @Post(':collection')
  @ApiBody({ type: [ObjectDocument] })
  async insert(@Param('projectId') projectId: string, @Param('collection') collection: string, @Body() documents: [ObjectDocument]): Promise<Array<ObjectDocument>> {
    return this.databaseService.insert(collection, documents, projectId);
  }

  @Put(':collection')
  @ApiBody({ type: [ObjectDocument] })
  async update(@Param('projectId') projectId: string, @Param('collection') collection: string, @Body() documents: [ObjectDocument]): Promise<Array<ObjectDocument>> {
    return this.databaseService.update(collection, documents, projectId, this.getOwner(req));
  }

  @Delete(':collection')
  @ApiBody({ type: [ObjectDocument] })
  async delete(@Param('projectId') projectId: string, @Param('collection') collection: string, @Body() documents: [ObjectDocument]): Promise<Array<ObjectDocument>> {
    return this.databaseService.delete(collection, documents, projectId, this.getOwner(req));
  }

}
