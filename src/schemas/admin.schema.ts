import * as mongoose from 'mongoose';

export const AdminSchema = new mongoose.Schema({
  name: String,
  passwordHash: String,
  email: String,
});