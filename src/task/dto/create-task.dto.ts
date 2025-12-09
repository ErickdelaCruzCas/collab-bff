import { IsNotEmpty, IsOptional, IsString, MaxLength, IsInt } from 'class-validator';
import { TaskStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CreateTaskDto {
  @IsInt()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
