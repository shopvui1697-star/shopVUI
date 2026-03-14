import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomBytes, createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';

interface StateEntry {
  userId: string;
  channel: string;
  nonce: string;
  expiresAt: number;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly stateMap = new Map<string, StateEntry>();
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>('CHANNEL_ENCRYPTION_KEY', randomBytes(32).toString('hex'));
  }

  generateState(userId: string, channel: string): string {
    const nonce = randomBytes(16).toString('hex');
    const payload = `${userId}:${channel}:${nonce}`;
    const signature = createHmac('sha256', this.secret).update(payload).digest('hex');
    const state = `${payload}:${signature}`;

    this.stateMap.set(state, {
      userId,
      channel,
      nonce,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min TTL
    });

    return state;
  }

  validateState(state: string): { userId: string; channel: string } {
    const entry = this.stateMap.get(state);
    if (!entry) {
      throw new BadRequestException('Invalid or expired OAuth state');
    }

    if (Date.now() > entry.expiresAt) {
      this.stateMap.delete(state);
      throw new BadRequestException('OAuth state has expired');
    }

    // Verify signature
    const parts = state.split(':');
    const signature = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join(':');
    const expectedSignature = createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      this.stateMap.delete(state);
      throw new BadRequestException('Invalid OAuth state signature');
    }

    this.stateMap.delete(state); // one-time use
    return { userId: entry.userId, channel: entry.channel };
  }
}
