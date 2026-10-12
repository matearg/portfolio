import { ProjectsService } from './projects.service.js';

describe('ProjectsService', () => {
  it('queries only published projects, ordered', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await new ProjectsService({
      project: { findMany },
    } as never).findPublished();
    expect(findMany).toHaveBeenCalledWith({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });
  });

  it('maps a duplicate slug to 409 and a missing row to 404', async () => {
    const reject = (code: string) => vi.fn().mockRejectedValue({ code });
    const svc = (project: object) => new ProjectsService({ project } as never);
    await expect(
      svc({ create: reject('P2002') }).create({} as never),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      svc({ delete: reject('P2025') }).remove(1),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('renumbers ids 1..n in a single transaction', async () => {
    const updateMany = vi.fn((args: object) => args);
    const $transaction = vi.fn().mockResolvedValue([]);
    await new ProjectsService({
      project: { updateMany },
      $transaction,
    } as never).reorder([7, 3]);
    expect($transaction).toHaveBeenCalledWith([
      { where: { id: 7, order: { not: 1 } }, data: { order: 1 } },
      { where: { id: 3, order: { not: 2 } }, data: { order: 2 } },
    ]);
  });
});
