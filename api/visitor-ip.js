const jsonHeaders = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

const validAddress = (value) => typeof value === 'string'
  && value.length <= 64
  && /^[0-9a-f:.]+$/iu.test(value);

export default {
  fetch(request) {
    if (request.method !== 'GET') {
      return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: { ...jsonHeaders, Allow: 'GET' } });
    }

    const forwarded = request.headers.get('x-vercel-forwarded-for')
      ?? request.headers.get('x-forwarded-for')
      ?? request.headers.get('x-real-ip');
    const candidate = forwarded?.split(',')[0]?.trim() ?? '';
    return Response.json({ ip: validAddress(candidate) ? candidate : 'unavailable' }, { headers: jsonHeaders });
  },
};
