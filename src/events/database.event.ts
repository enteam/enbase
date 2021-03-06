export class DatabaseEvent {
  projectId: string;
  time: number;
  type: string;
  payload: object;
  collection: string;


  constructor(projectId: string, time: number, type: string, payload: object, collection: string) {
    this.projectId = projectId;
    this.time = time;
    this.type = type;
    this.payload = payload;
    this.collection = collection;
  }
}