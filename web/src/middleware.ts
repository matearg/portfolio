import { defineMiddleware } from 'astro:middleware';
import { ApiError } from './lib/api';

// Convenience gate for /admin pages; the real protection is the API's AdminGuard.
export const onRequest = defineMiddleware(async (ctx, next) => {
  if (!/^\/admin(\/|$)/.test(ctx.url.pathname)) return next();
  const isLogin = ctx.url.pathname.replace(/\/$/, '') === '/admin/login';
  let res: Response;
  if (!isLogin && !ctx.cookies.has('admin')) {
    res = ctx.redirect('/admin/login');
  } else {
    try {
      res = await next();
    } catch (e) {
      // Expired or forged token: drop it and sign in again.
      if (!(e instanceof ApiError && e.status === 401) || isLogin) throw e;
      ctx.cookies.delete('admin', { path: '/admin' });
      res = ctx.redirect('/admin/login');
    }
  }
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
});
