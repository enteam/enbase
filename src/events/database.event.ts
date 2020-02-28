export enum DatabaseEventType {
  INSERT, UPDATE, DELETE
}

export class DatabaseEvent {
  projectId: string;
  time: number;
  type: DatabaseEventType;
  payload: object;
  collection: string;


  constructor(projectId: string, time: number, type: DatabaseEventType, payload: object, collection: string) {
    this.projectId = projectId;
    this.time = time;
    this.type = type;
    this.payload = payload;
    this.collection = collection;
  }
}