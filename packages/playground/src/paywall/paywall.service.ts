import { Injectable, Logger, Request, Response } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { URL } from 'url'
import urljoin from 'url-join'
import { FastifyReply } from 'fastify'

@Injectable()
export class PaywallService {
  private readonly logger = new Logger(PaywallService.name)
  private readonly HEADER_NAME = 'authorization'
  private readonly TOKEN_NAME = 'paywall'
  private readonly PREFIX = '/payments'

  constructor(
    private configService: ConfigService,
    private readonly receiverAccount: `0x${string}`,
    private readonly base: URL,
  ) {}

  private acceptUrl(base: URL): string {
    return urljoin(base.toString(), this.PREFIX, 'accept')
  }

  private isAcceptUrl(url: string): boolean {
    return url === this.PREFIX + '/accept'
  }

  private isValidToken(token: string): boolean {
    const tokenRegex = /^0x[0-9a-fA-F]{64}$/
    return tokenRegex.test(token)
  }

  private paywallHeaders(
    receiverAccount: `0x${string}`,
    gatewayUri: string,
    price: bigint,
  ): Record<string, string> {
    return {
      'paywall-version': '1.0',
      'paywall-price': price.toString(),
      'paywall-address': receiverAccount,
      'paywall-gateway': gatewayUri,
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    const gatewayUrl = this.configService.get<string>('GATEWAY_URL')
    const response = await fetch(
      `${gatewayUrl}${this.PREFIX}/verify/${token}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      },
    )
    return response.status >= 200 && response.status < 300
  }

  async acceptPayment(body: any): Promise<any> {
    const gatewayUrl = this.configService.get<string>('GATEWAY_URL')
    const response = await fetch(`${gatewayUrl}${this.PREFIX}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    return response.json()
  }

  paymentRequired(price: bigint, req: Request, res: FastifyReply): void {
    this.logger.log(`Require payment ${price.toString()} for ${req.url}`)
    res
      .status(402)
      .send(
        this.paywallHeaders(
          this.receiverAccount,
          this.acceptUrl(this.base),
          price,
        ),
      )
      .send('Payment Required')
  }

  paymentInvalid(price: bigint, req: Request, res: FastifyReply): void {
    res
      .status(409)
      .send(
        this.paywallHeaders(
          this.receiverAccount,
          this.acceptUrl(this.base),
          price,
        ),
      )
      .send('Payment Invalid')
  }

  paymentRequiredToken(
    price: bigint,
    tokenContract: `0x${string}`,
    req: Request,
    res: FastifyReply,
  ): void {
    this.logger.log(`Require token payment ${price.toString()} for ${req.url}`)
    res
      .status(402)
      .send(
        this.paywallHeadersToken(
          this.receiverAccount,
          this.acceptUrl(this.base),
          price,
          tokenContract,
        ),
      )
      .send('Token Payment Required')
  }

  paymentInvalidToken(
    price: bigint,
    tokenContract: `0x${string}`,
    req: Request,
    res: FastifyReply,
  ): void {
    res
      .status(409)
      .send(
        this.paywallHeadersToken(
          this.receiverAccount,
          this.acceptUrl(this.base),
          price,
          tokenContract,
        ),
      )
      .send('Token Payment Invalid')
  }

  private paywallHeadersToken(
    receiverAccount: `0x${string}`,
    gatewayUri: string,
    price: bigint,
    tokenContract: `0x${string}`,
  ): Record<string, string> {
    return {
      ...this.paywallHeaders(receiverAccount, gatewayUri, price),
      'paywall-token-contract': tokenContract,
    }
  }

  async parseToken(
    req: Request,
  ): Promise<{ token: string; meta: string; price: bigint } | null> {
    const content = req.headers.get(this.HEADER_NAME) as string
    if (!content) {
      return null
    }

    const [type, token, meta, priceStr] = content.split(' ')
    if (type.toLowerCase() !== this.TOKEN_NAME || !this.isValidToken(token)) {
      return null
    }

    return { token, meta, price: BigInt(priceStr) }
  }
}
