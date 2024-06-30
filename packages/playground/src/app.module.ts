import 'dotenv/config'
import { Module } from '@nestjs/common'
import { PaywallModule } from './paywall/paywall.module'

@Module({
  imports: [PaywallModule],
})
export class AppModule {}
