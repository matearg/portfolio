import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { GithubModule } from './github/github.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProjectsModule } from './projects/projects.module.js';

@Module({ imports: [PrismaModule, AuthModule, ProjectsModule, GithubModule] })
export class AppModule {}
