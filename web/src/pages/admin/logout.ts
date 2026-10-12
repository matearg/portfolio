import type { APIRoute } from 'astro';

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete('admin', { path: '/admin' });
  return redirect('/admin/login');
};
