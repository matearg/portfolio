import { Module } from '@nestjs/common';
import { GithubController } from './github.controller.js';
import { GithubService } from './github.service.js';

@Module({ controllers: [GithubController], providers: [GithubService] })
export class GithubModule {}
