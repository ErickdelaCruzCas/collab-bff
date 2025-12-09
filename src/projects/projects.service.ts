import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ChangeProjectOwnerDto } from './dto/change-project-owner.dto';

@Injectable()
export class ProjectsService {

  constructor(private prisma: PrismaService) {}

  create(ownerId: number, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        ownerId,
      },
    });
  }

  async findAllByOwnerOrThrow(ownerId: number) {
    const projects = this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
    if (!projects) {
      throw new NotFoundException('User not found');
    }
    return  projects
  }

  async findOneByOwner(ownerId: number, id: number) {
    const project = await this.prisma.project.findFirst({
      where: { id, ownerId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(ownerId: number, id: number, dto: UpdateProjectDto) {
    // comprobamos que exista y pertenezca al owner
    await this.findOneByOwner(ownerId, id);

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async remove(ownerId: number, id: number) {
    // comprobamos que exista y pertenezca al owner
    await this.findOneByOwner(ownerId, id);

    await this.prisma.project.delete({
      where: { id },
    });

    return { deleted: true };
  }

  async changeOwner(
    currentUserId: number,
    projectId: number,
    dto: ChangeProjectOwnerDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== currentUserId) {
      throw new ForbiddenException('Only current owner can change owner');
    }

    const newOwner = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!newOwner) {
      throw new NotFoundException('Target user not found');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ownerId: dto.userId,
      },
    });
  }


  async assignProjectToProject(projectId: number, taskId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { projectId },   // 👈 AQUÍ está la asignación real
    });
  }
}
