import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ListTasksQueryDto } from './dto/list-task-query.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private async ensureProjectOwnedByUser(projectId: number, ownerId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new NotFoundException('Project not found or not owned by user');
    }

    return project;
  }

  async create(ownerId: number, dto: CreateTaskDto) {
    await this.ensureProjectOwnedByUser(dto.projectId, ownerId);

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TaskStatus.TODO,
        projectId: dto.projectId,
      },
    });
  }

  async findAll(ownerId: number, query: ListTasksQueryDto) {
    const { projectId, status } = query;
    const take = query.limit ?? 20;
    const skip = query.offset ?? 0;

    const where: any = {
      project: {
        ownerId,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items,
      total,
      limit: take,
      offset: skip,
    };
  }

  async findOne(ownerId: number, id: number) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        project: {
          ownerId,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(ownerId: number, id: number, dto: UpdateTaskDto) {
    const existing = await this.findOne(ownerId, id);

    if (dto.projectId && dto.projectId !== existing.projectId) {
      // si nos piden mover la tarea a otro proyecto, comprobamos ownership
      await this.ensureProjectOwnedByUser(dto.projectId, ownerId);
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        description: dto.description ?? existing.description,
        status: dto.status ?? existing.status,
        projectId: dto.projectId ?? existing.projectId,
      },
    });
  }

  async remove(ownerId: number, id: number) {
    await this.findOne(ownerId, id);

    await this.prisma.task.delete({
      where: { id },
    });

    return { deleted: true };
  }
}
