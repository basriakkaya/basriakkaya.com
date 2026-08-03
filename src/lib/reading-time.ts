const WORDS_PER_MINUTE = 200;

export function readingTime(body: string): string {
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>|[#*_>`\[\]()!-]/g, ' ')
    .trim();
  const words = text ? text.split(/\s+/u).length : 0;
  return `${Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))} dk okuma`;
}
