import { redirect, type Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) => {
  // Bypass paraglide for Firebase Auth handler paths — these serve
  // third-party HTML/JS that must not be transformed.
  if (event.url.pathname.startsWith('/__/')) {
    return resolve(event);
  }

  if (event.url.pathname === '/zh-cn' || event.url.pathname.startsWith('/zh-cn/')) {
    const pathname = event.url.pathname.slice('/zh-cn'.length) || '/';
    redirect(308, `${pathname}${event.url.search}`);
  }

  return paraglideMiddleware(event.request, async ({ request }) => {
    const response = await resolve({ ...event, request });
    const isPrivateRoute =
      event.url.pathname.startsWith('/auth') || event.url.pathname.startsWith('/workflow');

    response.headers.set(
      'X-Robots-Tag',
      isPrivateRoute
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );

    return response;
  });
};

export const handle: Handle = handleParaglide;
