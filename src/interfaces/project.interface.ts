import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class FieldSettings {
  @ApiProperty()
  @IsNotEmpty()
  name: string;
  @ApiProperty({
    default: true,
  })
  required: boolean;
  @ApiProperty({
    default: true,
  })
  publicWriteAccess: boolean;
  @ApiProperty({
    default: true,
  })
  publicReadAccess: boolean;
  @IsNotEmpty()
  @ApiProperty({
    default: true,
  })
  publicUpdateAccess: boolean;
  @IsNotEmpty()
  @ApiProperty({
    default: true,
  })
  publicDeleteAccess: boolean;
  @IsNotEmpty()
  @ApiProperty({ enum: ['string', 'number'] })
  type: string;
}

export class CollectionSchema {
  @IsNotEmpty()
  @ApiProperty()
  name: string;
  @IsNotEmpty()
  @ApiProperty({
    default: [],
    type: [FieldSettings],
  })
  fields: Array<FieldSettings>;
  @IsNotEmpty()
  @ApiProperty({
    default: true,
  })
  publicWriteAccess: boolean;
  @IsNotEmpty()
  @ApiProperty({
    default: true,
  })
  publicReadAccess: boolean;
  @IsNotEmpty()
  @ApiProperty({
    default: true,
  })
  publicUpdateAccess: boolean;
  @IsNotEmpty()
  @ApiProperty({
    default: true,
  })
  publicDeleteAccess: boolean;
}

export class DatabaseSchema {
  @ApiProperty({
    default: [],
    type: [CollectionSchema],
  })
  collections: Array<CollectionSchema>;
}

export class FacebookLoginOptions {
  @ApiProperty()
  @IsNotEmpty()
  appId: string;
  @ApiProperty()
  @IsNotEmpty()
  appSecret: string;
}

export class LoginOptions {
  @ApiPropertyOptional()
  facebook?: FacebookLoginOptions;
}

export class Project {
  @IsNotEmpty()
  @ApiProperty()
  name: string;
  @ApiProperty()
  userId: string;
  @ApiProperty()
  @IsNotEmpty()
  databaseSchema: DatabaseSchema;
  @ApiProperty()
  loginOptions: LoginOptions;
  @ApiProperty()
  deploymentId: string;
}

export class ProjectDocument extends Document implements Project {
  databaseSchema: DatabaseSchema;
  loginOptions: LoginOptions;
  name: string;
  userId: string;
  deploymentId: string;
}