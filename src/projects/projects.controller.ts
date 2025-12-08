import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateProjectDto) {
    const ownerId = req.user.userId;
    return this.projectsService.create(ownerId, dto);
  }

  @Get()
  findAll(@Req() req) {
    const ownerId = req.user.userId;
    return this.projectsService.findAllByOwner(ownerId);
  }

  @Get(':id')
  findOne(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const ownerId = req.user.userId;
    return this.projectsService.findOneByOwner(ownerId, id);
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    const ownerId = req.user.userId;
    return this.projectsService.update(ownerId, id, dto);
  }

  @Delete(':id')
  remove(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const ownerId = req.user.userId;
    return this.projectsService.remove(ownerId, id);
  }
}
