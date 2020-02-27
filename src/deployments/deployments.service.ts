import { Injectable, Inject, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { Deployment, DeploymentDocument, DeploymentInstance } from '../interfaces/deployment.interface';
import { Project, ProjectDocument } from '../interfaces/project.interface';
import { AdminDocument } from '../interfaces/admin.interface';
import { Model, Types, Document } from 'mongoose';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as AdmZip from 'adm-zip';
import { promisify } from 'util';

const exec = promisify(require('child_process').exec);

@Injectable()
export class DeploymentsService implements OnModuleInit {
  private readonly logger = new Logger(DeploymentsService.name);

  static instances: Array<DeploymentInstance> = [];

  constructor(
    @Inject('PROJECT_MODEL')
    private readonly projectModel: Model<ProjectDocument>,
    @Inject('DEPLOYMENT_MODEL')
    private readonly deploymentModel: Model<DeploymentDocument>,
  ) {
  }

  async deploy(admin: AdminDocument, projectId: string, code: any): Promise<Deployment> {
    const project = await this.projectModel.findOne({ _id: Types.ObjectId(projectId), userId: admin._id });
    if (project == null) throw new NotFoundException();
    const deployment: Deployment & Document = new this.deploymentModel();
    deployment.projectId = projectId;
    deployment.status = 'enqueued';
    deployment.startTime = new Date();
    deployment.logs = '';
    deployment.archive = code.buffer.toString('base64');
    await deployment.save();
    this.deliver(deployment._id, projectId, admin._id);
    deployment.archive = null;
    return deployment;
  }

  async index(admin: AdminDocument, projectId: string) {
    const project = await this.projectModel.findOne({ _id: Types.ObjectId(projectId), userId: admin._id });
    if (project == null) throw new NotFoundException();
    return await this.deploymentModel.find({ projectId: projectId });
  }

  async onModuleInit() {
    await this.mountAllProjects();
  }

  private async mountAllProjects() {
    const projects = await this.projectModel.find();
    for (const project of projects) {
      if (project.deploymentId != null) {
        this.deliver(project.deploymentId, project._id, project.userId);
      }
    }
  }

  async deliver(id: string, projectId: string, adminId: string): Promise<void> {
    this.logger.log(`Mounting cloud code for project: ${projectId}`);
    const project: Project & Document = await this.projectModel.findOne({
      _id: Types.ObjectId(projectId),
      userId: adminId,
    });
    const deployment: Deployment & Document = await this.deploymentModel.findOne({ _id: Types.ObjectId(id) });
    const workspace = process.cwd();
    this.ensureDirectoryExists(join(workspace, 'functions'));
    const archivesDirectory = join(workspace, 'functions', 'archives');
    const revisionsDirectory = join(workspace, 'functions', 'revisions');
    const deploymentDirectory = join(workspace, 'functions', 'revisions', deployment._id.toHexString());
    const archivePath = join(archivesDirectory, `${deployment._id.toHexString()}.zip`);
    this.ensureDirectoryExists(archivesDirectory);
    this.ensureDirectoryExists(revisionsDirectory);
    this.ensureDirectoryExists(deploymentDirectory);
    writeFileSync(archivePath, Buffer.from(deployment.archive, 'base64'));
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(deploymentDirectory);
    deployment.status = 'extracted';
    await deployment.save();
    const { stdout, stderr } = await exec('yarn', {
      cwd: revisionsDirectory,
    });
    deployment.logs = '';
    deployment.logs += stdout + '\n';
    deployment.logs += stderr + '\n';
    this.mount(deployment, join(deploymentDirectory, 'index.js'));
    deployment.status = 'mounted';
    deployment.finishTime = new Date();
    await deployment.save();
    project.deploymentId = deployment._id.toHexString();
    await project.save();
  }

  private async mount(deployment: Deployment & Document, path: string): Promise<void> {
    DeploymentsService.instances.splice(DeploymentsService.instances.indexOf(DeploymentsService.instances.find(x => x.projectId == deployment.projectId)), 1);
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    global.Enbase = {
      functions: {
        define(name, handler) {
          const instance = new DeploymentInstance();
          instance.projectId = deployment.projectId;
          instance.name = name;
          instance.type = 'function';
          instance.handler = handler;
          DeploymentsService.instances.push(instance);
        },
      },
    };
    this.clearRequireCache();
    require(path);
  }

  private clearRequireCache() {
    Object.keys(require.cache).forEach(function(key) {
      delete require.cache[key];
    });
  }

  private ensureDirectoryExists(dir) {
    if (!existsSync(dir)) {
      mkdirSync(dir);
    }
  }

}
