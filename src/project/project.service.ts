import { Inject, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../interfaces/project.interface';
import { AdminDocument } from '../interfaces/admin.interface';

@Injectable()
export class ProjectService {
  constructor(
    @Inject('PROJECT_MODEL')
    private readonly projectModel: Model<ProjectDocument>,
  ) {
  }

  async index(admin: AdminDocument): Promise<Array<Project>> {
    return this.projectModel.find({ userId: admin._id });
  }

  async create(admin: AdminDocument, project: Project): Promise<Project> {
    project.userId = admin._id;
    return (await this.projectModel.insertMany([
      project,
    ]))[0];
  }

  async edit(admin: AdminDocument, project: Project, id: string): Promise<Project> {
    await this.projectModel.update({ _id: Types.ObjectId(id), userId: admin._id }, project);
    return project;
  }

  async remove(admin: AdminDocument, id: string): Promise<void> {
    await this.projectModel.remove({ _id: Types.ObjectId(id), userId: admin._id });
  }
}
