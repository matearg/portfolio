import { Controller, Get } from '@nestjs/common';
import { GithubService } from './github.service.js';

@Controller('github')
export class GithubController {
  constructor(private readonly github: GithubService) {}

  @Get('contributions')
  contributions() {
    return this.github.contributions();
  }
}
