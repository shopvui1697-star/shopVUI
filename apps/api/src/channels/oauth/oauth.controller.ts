import {
  Controller,
  Get,
  Query,
  Param,
  Res,
  Req,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import { ChannelConnectionService } from '../channel-connection.service';
import type { ChannelAdapter } from '../adapters/channel-adapter.interface';
import type { ChannelType } from '@shopvui/db';

@Controller('channels/oauth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);
  private readonly adapters = new Map<string, ChannelAdapter>();

  constructor(
    private readonly oauthService: OAuthService,
    private readonly connectionService: ChannelConnectionService,
  ) {}

  registerAdapter(channel: string, adapter: ChannelAdapter): void {
    this.adapters.set(channel.toUpperCase(), adapter);
  }

  @Get(':channel')
  @UseGuards(AuthGuard('jwt'))
  async redirectToOAuth(
    @Param('channel') channel: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const adapter = this.adapters.get(channel.toUpperCase());
    if (!adapter) {
      throw new BadRequestException(`Unsupported channel: ${channel}`);
    }

    const user = req.user as any;
    const state = this.oauthService.generateState(user.id, channel.toUpperCase());
    const url = adapter.getOAuthUrl(state);

    res.redirect(302, url);
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('shop_id') shopId: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state parameter');
    }

    const { userId, channel } = this.oauthService.validateState(state);
    const adapter = this.adapters.get(channel);

    if (!adapter) {
      throw new BadRequestException(`No adapter for channel: ${channel}`);
    }

    const tokenResult = await adapter.exchangeCode(code, shopId ?? '');

    await this.connectionService.create({
      channel: channel as ChannelType,
      shopId: shopId ?? tokenResult.shopName,
      shopName: tokenResult.shopName,
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokenResult.expiresIn * 1000),
      createdById: userId,
    });

    res.redirect('/admin/channels');
  }
}
