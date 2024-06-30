import { Module } from '@nestjs/common'
import { PaywallService } from './paywall.service'
import { PaywallController } from './paywall.controller'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule],
  providers: [PaywallService],
  controllers: [PaywallController],
  exports: [PaywallService],
})
export class PaywallModule {}
