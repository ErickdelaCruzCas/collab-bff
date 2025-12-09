// src/projects/dto/change-project-owner.dto.ts
import { IsInt } from 'class-validator';

export class ChangeProjectOwnerDto {
  @IsInt()
  userId: number; // nuevo owner
}
