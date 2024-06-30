import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )

  app.setGlobalPrefix('api/v0')
  console.log(
    `Running with HOST=${process.env.HOST || '0.0.0.0'} PORT=${process.env.PORT || 3000}`,
  )
  await app.listen(process.env.PORT || 3000, process.env.HOST || '0.0.0.0')
}
bootstrap()
