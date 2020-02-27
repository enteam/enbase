import * as mongoose from 'mongoose';

export const DeploymentSchema = new mongoose.Schema({
  projectId: String,
  logs: String,
  startTime: String,
  finishTime: Date,
  status: String,
  archive: String,
});