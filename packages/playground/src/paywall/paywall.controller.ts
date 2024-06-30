import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common'
import { Request, Response } from 'express'
import { PaywallService } from './paywall.service'
import { PaywallGuard } from './paywall.guard'

@Controller('payments')
export class PaywallController {
  constructor(private readonly paywallService: PaywallService) {}

  @Post('accept')
  async acceptPayment(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.paywallService.acceptPayment(req.body)
      res.status(202).header('Paywall-Token', result.token).json(result)
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  @UseGuards(PaywallGuard)
  @Post('protected-route')
  async protectedRoute(@Req() req: Request, @Res() res: Response) {
    res.json({ message: 'Access granted to protected route' })
  }
}
