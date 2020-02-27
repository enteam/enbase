import * as mongoose from 'mongoose';

export const ProjectSchema = new mongoose.Schema({
  name: String,
  userId: String,
  databaseSchema: Object,
  loginOptions: {
    facebook: {
      appId: String,
      appSecret: String,
    },
  },
  deploymentId: String,
});