import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class AccessControlEntry {
  @ApiProperty()
  @IsNotEmpty()
  owner: string;
  @ApiProperty()
  @IsNotEmpty()
  read: boolean;
  @ApiProperty()
  @IsNotEmpty()
  update: boolean;
  @ApiProperty()
  @IsNotEmpty()
  delete: boolean;
}

export class ObjectDocument {
  @ApiProperty({ type: [AccessControlEntry] })
  @IsNotEmpty()
  acl: Array<AccessControlEntry>;
  _id: string;
}