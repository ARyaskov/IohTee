import AbstractPaymentsDatabase from '../AbstractPaymentsDatabase'
import { EngineSqlite } from './EngineSqlite'
import ChannelId from '../../ChannelId'
import Payment, { PaymentJSON, PaymentSerde } from '../../payment'

export class SqlitePaymentsDatabase extends AbstractPaymentsDatabase<EngineSqlite> {
  async save(token: string, payment: Payment): Promise<void> {
    return this.engine.exec(async (client) => {
      const serialized: any = PaymentSerde.instance.serialize(payment)
      serialized.kind = this.kind
      serialized.token = token
      client.run(
        'INSERT INTO payment("channelId", kind, token, sender, receiver, price, value, ' +
          '"channelValue", v, r, s, meta, "contractAddress", "createdAt") VALUES($channelId, $kind, $token, $sender, ' +
          '$receiver, $price, $value, $channelValue, $v, $r, $s, $meta, $contractAddress, $createdAt)',
        {
          channelId: serialized.channelId,
          kind: serialized.kind,
          token: serialized.token,
          sender: serialized.sender,
          receiver: serialized.receiver,
          price: serialized.price,
          value: serialized.value,
          channelValue: serialized.channelValue,
          v: serialized.v,
          r: serialized.r,
          s: serialized.s,
          meta: serialized.meta,
          contractAddress: serialized.contractAddress,
          createdAt: Date.now(),
        },
      )
    })
  }

  async firstMaximum(channelId: ChannelId | string): Promise<Payment | null> {
    return this.engine.exec(async (client) => {
      let row = client.get<PaymentJSON>(
        'SELECT "channelId", kind, token, sender, receiver, price, value, ' +
          '"channelValue", v, r, s, meta, "contractAddress", "createdAt" FROM payment WHERE "channelId" = $channelId ' +
          'ORDER BY value DESC',
        {
          channelId: channelId.toString(),
        },
      )
      return row ? this.inflatePayment(row) : null
    })
  }

  async findByToken(token: string): Promise<Payment | null> {
    return this.engine.exec(async (client) => {
      let row = client.get<PaymentJSON>(
        'SELECT "channelId", kind, token, sender, receiver, price, value, ' +
          '"channelValue", v, r, s, meta, "contractAddress", "createdAt" FROM payment WHERE token = $token',
        {
          token: token,
        },
      )
      return row ? this.inflatePayment(row) : null
    })
  }
}
