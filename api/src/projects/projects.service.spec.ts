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

  describe('cover cleanup', () => {
    const OLD =
      'https://res.cloudinary.com/demo/image/upload/v1/portfolio/old.jpg';
    const NEW =
      'https://res.cloudinary.com/demo/image/upload/v2/portfolio/new.jpg';
    const setup = (destroy = vi.fn().mockResolvedValue(undefined)) => {
      const project = {
        findUnique: vi.fn().mockResolvedValue({ imageUrl: OLD }),
        update: vi.fn((args: { data: object }) =>
          Promise.resolve({ imageUrl: OLD, ...args.data }),
        ),
        delete: vi.fn().mockResolvedValue({ imageUrl: OLD }),
        count: vi.fn().mockResolvedValue(0),
      };
      const cloudinary = {
        publicIdOf: vi.fn(
          (url: string) => url.includes('/portfolio/') && 'portfolio/old',
        ),
        destroy,
      };
      return {
        project,
        destroy,
        svc: new ProjectsService({ project } as never, cloudinary as never),
      };
    };

    it('destroys the old cover after an update that replaces it', async () => {
      const { svc, project, destroy } = setup();
      await svc.update(1, { imageUrl: NEW });
      expect(destroy).toHaveBeenCalledWith('portfolio/old');
      expect(destroy.mock.invocationCallOrder[0]).toBeGreaterThan(
        project.update.mock.invocationCallOrder[0],
      );
    });

    it('destroys the cover after a delete', async () => {
      const { svc, destroy } = setup();
      await svc.remove(1);
      expect(destroy).toHaveBeenCalledWith('portfolio/old');
    });

    it('keeps the cover when it is unchanged or omitted', async () => {
      const { svc, destroy } = setup();
      await svc.update(1, { imageUrl: OLD });
      await svc.update(1, { title: 'x' });
      expect(destroy).not.toHaveBeenCalled();
    });

    it('keeps the cover when another project still uses it', async () => {
      const { svc, project, destroy } = setup();
      project.count.mockResolvedValue(1);
      await svc.remove(1);
      expect(destroy).not.toHaveBeenCalled();
    });

    it('does not destroy when the DB write fails', async () => {
      const { svc, project, destroy } = setup();
      project.delete.mockRejectedValue({ code: 'P2025' });
      await expect(svc.remove(1)).rejects.toMatchObject({ status: 404 });
      expect(destroy).not.toHaveBeenCalled();
    });

    it('does not fail the request when destroy fails', async () => {
      const { svc } = setup(vi.fn().mockRejectedValue(new Error('boom')));
      await expect(svc.update(1, { imageUrl: null })).resolves.toMatchObject({
        imageUrl: null,
      });
      await expect(svc.remove(1)).resolves.toBeUndefined();
    });
  });
});
