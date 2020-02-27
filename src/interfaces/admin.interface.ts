import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class Admin {
  @ApiProperty()
  @IsNotEmpty()
  name: string;
  passwordHash: string;
  @ApiProperty()
  @IsNotEmpty()
  email: string;
  @ApiProperty()
  @IsNotEmpty()
  password: string;
}

export class AdminDocument extends Document implements Admin {
  email: string;
  name: string;
  password: string;
  passwordHash: string;

}