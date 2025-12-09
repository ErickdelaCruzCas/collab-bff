import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { id: 'asc' },
    });
  }

  create(data: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password, // si ya lo tienes en el DTO
      },
    });
  }

  async findByIdOrThrow(id: number) {
    Logger.log(`Calling find User By Id: ${id}`);
    
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async assignProjectToUser(userId: number, projectId: number) {
    // 1. validar existencia de user
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. validar existencia de project
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 3. actualizar ownerId
    return this.prisma.project.update({
      where: { id: projectId },
      data: { ownerId: userId },
    });
  }
}
