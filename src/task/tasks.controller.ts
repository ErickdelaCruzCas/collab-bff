import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-task-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateTaskDto) {
    const ownerId = req.user.userId;
    return this.tasksService.create(ownerId, dto);
  }

  @Get()
  findAll(@Req() req, @Query() query: ListTasksQueryDto) {
    const ownerId = req.user.userId;
    return this.tasksService.findAll(ownerId, query);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const ownerId = req.user.userId;
    return this.tasksService.findOne(ownerId, id);
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    const ownerId = req.user.userId;
    return this.tasksService.update(ownerId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const ownerId = req.user.userId;
    return this.tasksService.remove(ownerId, id);
  }
}
