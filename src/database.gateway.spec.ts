import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseGateway } from './database.gateway';

describe('DatabaseGateway', () => {
  let gateway: DatabaseGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseGateway],
    }).compile();

    gateway = module.get<DatabaseGateway>(DatabaseGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
