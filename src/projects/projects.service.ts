import { Injectable, NotFoundException } from '@nestjs/common';

import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

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

  findAllByOwner(ownerId: number) {
    return this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
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
}
