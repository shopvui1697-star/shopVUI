'use client';

import { useState } from 'react';
import Image from 'next/image';
import { isImageUrl } from '../lib/media';

interface MediaItem {
  id: string;
  url: string;
  alt: string | null;
}

const VIDEO_FILE_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];

type MediaType = 'image' | 'video-file' | 'video-embed';

function getMediaType(url: string): MediaType {
  const path = url.split('?')[0].toLowerCase();
  if (VIDEO_FILE_EXTENSIONS.some((ext) => path.endsWith(ext))) return 'video-file';
  if (!isImageUrl(url)) return 'video-embed';
  return 'image';
}

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url;
}

export function ProductGallery({
  images,
  productName,
  noImageLabel,
}: {
  images: MediaItem[];
  productName: string;
  noImageLabel: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
        <div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-900">
          <span className="text-neutral-400">{noImageLabel}</span>
        </div>
      </div>
    );
  }

  const activeType = getMediaType(active.url);

  return (
    <div>
      {/* Main display */}
      <div className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
        {activeType === 'video-file' && (
          <video
            key={active.id}
            src={active.url}
            controls
            playsInline
            className="h-full w-full object-contain"
            data-testid="primary-video"
          />
        )}
        {activeType === 'video-embed' && (
          <iframe
            key={active.id}
            src={getEmbedUrl(active.url)}
            title={active.alt ?? productName}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
            data-testid="primary-video"
          />
        )}
        {activeType === 'image' && (
          <Image
            key={active.id}
            src={active.url}
            alt={active.alt ?? productName}
            fill
            sizes="(min-width: 768px) 66vw, 100vw"
            className="object-contain"
            data-testid="primary-image"
            priority
          />
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((item, index) => {
            const type = getMediaType(item.url);
            const isActive = index === activeIndex;

            return (
              <button
                key={item.id}
                onClick={() => setActiveIndex(index)}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                  isActive
                    ? 'border-[3px] border-blue-600 ring-2 ring-blue-600/30 dark:border-blue-400 dark:ring-blue-400/30'
                    : 'border border-neutral-200 opacity-60 hover:opacity-100 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600'
                }`}
              >
                {type !== 'image' ? (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6 text-neutral-500 dark:text-neutral-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={item.alt ?? productName}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                    data-testid="thumbnail"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
