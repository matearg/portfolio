import { ProjectsService } from './projects.service.js';

describe('ProjectsService', () => {
  it('queries only published projects, ordered', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await new ProjectsService({ project: { findMany } } as never).findPublished();
    expect(findMany).toHaveBeenCalledWith({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });
  });
});
