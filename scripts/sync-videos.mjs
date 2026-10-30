import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const channelId = 'UCnROFYgjE3v9HgLLV9d77pQ';
const cacheFile = path.join(root, 'src/data/videos.json');
const existing = JSON.parse(await readFile(cacheFile, 'utf8'));
const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};
async function get(url) {
  const r = await fetch(url, {
    headers: { 'Accept-Language': 'tr-TR,tr;q=0.9' },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw Error(`HTTP ${r.status}`);
  return r;
}
function collect(data) {
  const found = [];
  function walk(o) {
    if (!o || typeof o !== 'object') return;
    if (o.lockupViewModel?.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
      const v = o.lockupViewModel;
      found.push({
        id: v.contentId,
        title: v.metadata?.lockupMetadataViewModel?.title?.content,
        duration:
          v.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel
            ?.badges?.[0]?.thumbnailBadgeViewModel?.text,
      });
    }
    if (o.videoRenderer) {
      const v = o.videoRenderer;
      found.push({
        id: v.videoId,
        title: v.title?.runs?.map((x) => x.text).join(''),
        duration: v.lengthText?.simpleText,
      });
    }
    for (const v of Object.values(o)) walk(v);
  }
  walk(data);
  return [
    ...new Map(
      found.filter((v) => /^[\w-]{11}$/.test(v.id) && v.title).map((v) => [v.id, v]),
    ).values(),
  ];
}
try {
  // Use the channel's public Videos page, not the Shorts page. No login or API secret.
  const html = await (await get('https://www.youtube.com/@basrikkya/videos?hl=tr')).text();
  if (!html.includes(channelId)) throw Error('Channel identity could not be verified');
  const raw = html.match(/var ytInitialData = (\{.*?\});<\/script>/s)?.[1];
  if (!raw) throw Error('YouTube page format changed');
  const found = collect(JSON.parse(raw)).slice(0, 12);
  if (!found.length) throw Error('No public videos found; preserving last good cache');
  const next = [];
  for (const v of found) {
    const old = existing.find((x) => x.id === v.id);
    let image = old?.image;
    if (!image) {
      const filename = `${v.id}.jpg`;
      const dest = path.join(root, 'public/images/videos', filename);
      await mkdir(path.dirname(dest), { recursive: true });
      if (!(await exists(dest))) {
        const response = await get(`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`);
        if (!response.headers.get('content-type')?.startsWith('image/'))
          throw Error('Invalid thumbnail');
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length > 2000000) throw Error('Thumbnail too large');
        await writeFile(dest, bytes);
      }
      image = `/images/videos/${filename}`;
    }
    next.push({
      id: v.id,
      title: v.title,
      image,
      ...(old?.titleEn ? { titleEn: old.titleEn } : {}),
      description: old?.description ?? 'Güvenlik araştırmalarından yeni bir hikâye.',
      duration: v.duration ?? old?.duration ?? 'YouTube',
    });
  }
  const serialized = JSON.stringify(next, null, 2) + '\n';
  if (serialized !== (await readFile(cacheFile, 'utf8'))) await writeFile(cacheFile, serialized);
  console.log(
    `Video sync verified: ${next.length} public videos; approved cover overrides preserved.`,
  );
} catch (error) {
  console.error(`Video sync unavailable: ${error.message}. Existing cache retained.`);
  if (process.argv.includes('--strict')) process.exitCode = 1;
}
