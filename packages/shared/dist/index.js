// src/utils/currency.ts
function formatCurrency(amount, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount / 100);
}

// src/utils/media.ts
var VIDEO_FILE_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov"];
var VIDEO_HOSTS = ["youtube.com", "youtu.be", "vimeo.com"];
function isImageUrl(url) {
  const lower = url.toLowerCase();
  const path = lower.split("?")[0];
  if (VIDEO_FILE_EXTENSIONS.some((ext) => path.endsWith(ext))) return false;
  if (VIDEO_HOSTS.some((host) => lower.includes(host))) return false;
  return true;
}
function findFirstImageUrl(images) {
  return images.find((img) => isImageUrl(img.url))?.url ?? null;
}
export {
  findFirstImageUrl,
  formatCurrency,
  isImageUrl
};
