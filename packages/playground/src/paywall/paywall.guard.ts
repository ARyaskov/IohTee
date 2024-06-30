import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { PaywallService } from './paywall.service'

@Injectable()
export class PaywallGuard implements CanActivate {
  constructor(private paywallService: PaywallService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)
    if (!token) {
      throw new UnauthorizedException()
    }
    try {
      const isValid = await this.paywallService.verifyToken(token)
      if (!isValid) {
        throw new UnauthorizedException('Invalid paywall token')
      }
      return true
    } catch {
      throw new UnauthorizedException()
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.get('Authorization')?.split(' ') ?? []
    return type === 'paywall' ? token : undefined
  }
}
