import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('PWA Manifest', () => {
  const manifest = JSON.parse(
    readFileSync(resolve(__dirname, '../../public/manifest.json'), 'utf-8'),
  );

  it('has required PWA fields', () => {
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
    expect(manifest.icons).toBeDefined();
  });

  it('name is ShopVui', () => {
    expect(manifest.name).toBe('ShopVui');
  });

  it('display is standalone', () => {
    expect(manifest.display).toBe('standalone');
  });
});
