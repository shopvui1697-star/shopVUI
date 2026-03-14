import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { prisma } from '@shopvui/db';

@Injectable()
export class ResellerGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const baseResult = await super.canActivate(context);
    if (!baseResult) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.role !== 'reseller') {
      throw new ForbiddenException('Reseller access required');
    }

    const reseller = await prisma.reseller.findUnique({
      where: { userId: user.sub },
    });

    if (!reseller || reseller.status !== 'ACTIVE') {
      throw new ForbiddenException('Reseller account is not active');
    }

    request.reseller = reseller;
    return true;
  }
}
