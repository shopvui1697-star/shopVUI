export { isImageUrl } from '@shopvui/shared';

import { isImageUrl } from '@shopvui/shared';

export function findFirstImage(
  images: { url: string; alt: string | null }[],
): { url: string; alt: string | null } | undefined {
  return images.find((img) => isImageUrl(img.url));
}
