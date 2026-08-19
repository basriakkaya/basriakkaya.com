const responseHeaders = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
};

const clean = (value, maxLength) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f]/gu, ' ').trim().slice(0, maxLength)
  : '';

const validAddress = (value) => typeof value === 'string'
  && value.length <= 64
  && /^[0-9a-f:.]+$/iu.test(value);

function getClientAddress(request) {
  const forwarded = request.headers.get('x-vercel-forwarded-for')
    ?? request.headers.get('x-forwarded-for')
    ?? request.headers.get('x-real-ip');
  const candidate = forwarded?.split(',')[0]?.trim() ?? '';
  return validAddress(candidate) ? candidate : 'unavailable';
}

function getDiscordWebhook() {
  const value = process.env.ADMIN_ALERT_WEBHOOK_URL;
  if (!value || value.length > 512) return null;

  try {
    const url = new URL(value);
    const validHost = url.protocol === 'https:' && url.hostname === 'discord.com';
    const validPath = /^\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+$/u.test(url.pathname);
    return validHost && validPath ? url : null;
  } catch {
    return null;
  }
}

function isSameOriginBrowserRequest(request) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (!origin || fetchSite !== 'same-origin') return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: { ...responseHeaders, Allow: 'POST' } });
    }
    if (!isSameOriginBrowserRequest(request)) {
      return Response.json({ error: 'forbidden' }, { status: 403, headers: responseHeaders });
    }

    const webhook = getDiscordWebhook();
    if (!webhook) return Response.json({ error: 'alerts_unavailable' }, { status: 503, headers: responseHeaders });

    const country = clean(request.headers.get('x-vercel-ip-country'), 2).toUpperCase() || '—';
    const requestId = clean(request.headers.get('x-vercel-id'), 96) || '—';
    const userAgent = clean(request.headers.get('user-agent'), 180) || '—';
    const timestamp = new Date().toISOString();
    webhook.searchParams.set('wait', 'true');

    const discordResponse = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Admin Gateway Monitor',
        allowed_mentions: { parse: [] },
        embeds: [{
          title: 'Admin access attempt',
          color: 16739179,
          description: 'A visitor submitted the restricted access form.',
          fields: [
            { name: 'IP address', value: `\`${getClientAddress(request)}\``, inline: true },
            { name: 'Country', value: `\`${country}\``, inline: true },
            { name: 'Time (UTC)', value: `\`${timestamp}\``, inline: false },
            { name: 'User-Agent', value: `\`${userAgent}\``, inline: false },
            { name: 'Vercel request', value: `\`${requestId}\``, inline: false },
          ],
          footer: { text: 'No username or password was collected.' },
        }],
      }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => null);

    if (!discordResponse?.ok) return Response.json({ error: 'delivery_failed' }, { status: 502, headers: responseHeaders });
    return Response.json({ delivered: true }, { headers: responseHeaders });
  },
};
