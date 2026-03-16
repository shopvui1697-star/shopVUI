const VIDEO_FILE_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];
const VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'vimeo.com'];

export function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  const path = lower.split('?')[0];
  if (VIDEO_FILE_EXTENSIONS.some((ext) => path.endsWith(ext))) return false;
  if (VIDEO_HOSTS.some((host) => lower.includes(host))) return false;
  return true;
}

export function findFirstImageUrl(
  images: { url: string }[],
): string | null {
  return images.find((img) => isImageUrl(img.url))?.url ?? null;
}
