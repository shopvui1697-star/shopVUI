import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import type { IStorageAdapter } from './storage.interface';

@Injectable()
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(filename: string, buffer: Buffer): Promise<string> {
    const safeName = path.basename(filename);
    const filePath = path.join(this.uploadDir, safeName);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(this.uploadDir))) {
      throw new Error('Invalid filename');
    }
    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/${safeName}`;
  }
}
