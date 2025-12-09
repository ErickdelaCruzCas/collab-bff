// src/users/dto/assign-project.dto.ts
import { IsInt } from 'class-validator';

export class AssignTaskDto {
  @IsInt()
  taskId: number;
}
