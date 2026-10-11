import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.project.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });
  }
}
