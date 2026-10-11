import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const projects = [
  { tags: ['Astro', 'NestJS', 'PostgreSQL', 'Prisma'], featured: true },
  { tags: ['NestJS', 'PostgreSQL'] },
  { tags: ['Astro', 'TypeScript'] },
  { tags: ['Node.js', 'NestJS', 'Prisma'] },
  { tags: ['Astro', 'TypeScript', 'Prisma'], published: false },
  { tags: ['Node.js', 'PostgreSQL'] },
].map((p, i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    title: `[Project ${n}]`,
    slug: `project-${n}`,
    summaryEn: '[One line: what it does and the problem it solved]',
    summaryEs: '[Una línea: qué hace y qué problema resolvió]',
    year: 2026,
    featured: false,
    published: true,
    order: i + 1,
    ...p,
  };
});

for (const p of projects) {
  await prisma.project.upsert({ where: { slug: p.slug }, update: p, create: p });
}
await prisma.$disconnect();
