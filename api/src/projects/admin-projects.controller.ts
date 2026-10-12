import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseFilePipeBuilder,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../auth/admin.guard.js';
import { CloudinaryService } from './cloudinary.service.js';
import { CreateProjectDto, UpdateProjectDto } from './project.dto.js';
import { ProjectsService } from './projects.service.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// The guard sits on the class so every route added here is admin-only.
@Controller('admin/projects')
@UseGuards(AdminGuard)
export class AdminProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Get()
  list() {
    return this.projects.findAll();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.projects.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projects.remove(id);
  }

  @Post('cover')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }),
  )
  async cover(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(png|jpeg|webp|avif|gif)$/ })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    return { url: await this.cloudinary.upload(file) };
  }
}
