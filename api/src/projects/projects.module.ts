import { Module } from '@nestjs/common';
import { AdminProjectsController } from './admin-projects.controller.js';
import { CloudinaryService } from './cloudinary.service.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';

@Module({
  controllers: [ProjectsController, AdminProjectsController],
  providers: [ProjectsService, CloudinaryService],
})
export class ProjectsModule {}
