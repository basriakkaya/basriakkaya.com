/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import type { WorkboxPlugin } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision?: string }> };

const DAY = 24 * 60 * 60;
const operationsConsolePaths = new Set(['/admin', '/admin/', '/admin/index.html']);
const systemPath = /^\/(?:\.well-known\/security\.txt|en\/rss\.xml|robots\.txt|rss\.xml|site\.webmanifest|sw\.js|registerSW\.js|sitemap(?:-index|-\d+)?\.xml)$/u;
const analyticsPath = /^\/_vercel\/(?:insights|speed-insights)(?:\/|$)/u;
const isSystemPath = (pathname: string) => operationsConsolePaths.has(pathname) || systemPath.test(pathname);

const safeResponsePlugin: WorkboxPlugin = {
  cacheWillUpdate: async ({ response }) => {
    const cacheControl = response.headers.get('cache-control') ?? '';
    return response.status === 200 && !/\bno-store\b/iu.test(cacheControl) ? response : null;
  },
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

registerRoute(
  ({ request, url }) => request.method === 'GET' && url.origin === self.location.origin && (isSystemPath(url.pathname) || analyticsPath.test(url.pathname)),
  new NetworkOnly(),
);

const navigationStrategy = new NetworkFirst({
  cacheName: 'basri-html-v1',
  networkTimeoutSeconds: 4,
  plugins: [
    safeResponsePlugin,
    new ExpirationPlugin({ maxEntries: 25, maxAgeSeconds: 7 * DAY, purgeOnQuotaError: true }),
  ],
});

registerRoute(
  ({ request, url }) => request.method === 'GET'
    && request.mode === 'navigate'
    && url.origin === self.location.origin
    && !request.headers.has('authorization')
    && !isSystemPath(url.pathname)
    && !analyticsPath.test(url.pathname),
  async (context) => {
    try {
      return await navigationStrategy.handle(context);
    } catch {
      return await matchPrecache('/offline.html') ?? Response.error();
    }
  },
);

registerRoute(
  ({ request, url }) => request.method === 'GET' && request.destination === 'image' && url.origin === self.location.origin && !request.headers.has('authorization'),
  new StaleWhileRevalidate({
    cacheName: 'basri-images-v1',
    plugins: [
      safeResponsePlugin,
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * DAY, purgeOnQuotaError: true }),
    ],
  }),
);

registerRoute(
  ({ request, url }) => request.method === 'GET' && request.destination === 'font' && url.origin === self.location.origin && !request.headers.has('authorization'),
  new CacheFirst({
    cacheName: 'basri-fonts-v1',
    plugins: [
      safeResponsePlugin,
      new ExpirationPlugin({ maxEntries: 12, maxAgeSeconds: 365 * DAY, purgeOnQuotaError: true }),
    ],
  }),
);
