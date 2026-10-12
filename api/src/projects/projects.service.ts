import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProjectDto, UpdateProjectDto } from './project.dto.js';

const ordered = [{ order: 'asc' as const }, { id: 'asc' as const }];

// Turns Prisma's known errors into HTTP errors; anything else stays a 500.
function rethrow(e: unknown): never {
  const code = (e as { code?: string }).code;
  if (code === 'P2002') throw new ConflictException('Slug already in use');
  if (code === 'P2025') throw new NotFoundException('Project not found');
  throw e;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.project.findMany({
      where: { published: true },
      orderBy: ordered,
    });
  }

  findAll() {
    return this.prisma.project.findMany({ orderBy: ordered });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  create(data: CreateProjectDto) {
    return this.prisma.project.create({ data }).catch(rethrow);
  }

  update(id: number, data: UpdateProjectDto) {
    return this.prisma.project.update({ where: { id }, data }).catch(rethrow);
  }

  // Renumbers the given ids 1..n in one transaction. Rows already in place are
  // skipped so their updatedAt stays put; unknown ids are a no-op.
  async reorder(ids: number[]) {
    await this.prisma.$transaction(
      ids.map((id, i) =>
        this.prisma.project.updateMany({
          where: { id, order: { not: i + 1 } },
          data: { order: i + 1 },
        }),
      ),
    );
  }

  async remove(id: number) {
    await this.prisma.project.delete({ where: { id } }).catch(rethrow);
  }
}
