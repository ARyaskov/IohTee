import Serde from './Serde'
import Signature from './Signature'

export interface PaymentJSON {
  channelId: `0x${string}`
  sender: `0x${string}`
  receiver: `0x${string}`
  price: bigint
  value: bigint
  channelValue: bigint
  v: number | string
  r: string
  s: string
  meta: string
  token: string | undefined
  createdAt?: number
  tokenContract?: `0x${string}`
}

export interface SerializedPayment {
  channelId: `0x${string}`
  value: bigint
  sender: `0x${string}`
  receiver: `0x${string}`
  price: bigint
  channelValue: bigint
  v: number
  r: string
  s: string
  token?: string
  meta: string
  createdAt?: number
  tokenContract?: `0x${string}`
}

export default class Payment {
  channelId: `0x${string}`
  sender: `0x${string}`
  receiver: `0x${string}`
  price: bigint
  value: bigint
  channelValue: bigint
  signature: `0x${string}`
  meta: string
  token: string | undefined
  createdAt?: number
  tokenContract: `0x${string}`

  constructor(options: Payment) {
    this.channelId = options.channelId
    this.sender = options.sender
    this.receiver = options.receiver
    this.price = options.price
    this.value = options.value
    this.channelValue = options.channelValue
    this.signature = options.signature
    this.meta = options.meta
    this.token = options.token
    this.createdAt = options.createdAt
    this.tokenContract = options.tokenContract
  }
}

export class PaymentSerde implements Serde<Payment> {
  static instance: PaymentSerde = new PaymentSerde()

  static required = [
    'channelId',
    'value',
    'sender',
    'receiver',
    'price',
    'channelValue',
    'v',
    'r',
    's',
  ]

  serialize(obj: Payment): SerializedPayment {
    const sig = Signature.fromRpcSig(obj.signature).toParts()

    return {
      channelId: obj.channelId,
      value: obj.value,
      sender: obj.sender,
      receiver: obj.receiver,
      price: obj.price,
      channelValue: obj.channelValue,
      v: sig.v,
      r: sig.r,
      s: sig.s,
      token: obj.token,
      meta: obj.meta,
      createdAt: obj.createdAt,
      tokenContract: obj.tokenContract,
    }
  }

  deserialize(data: any): Payment {
    const sig = Signature.fromParts({
      v: Number(data.v),
      r: data.r,
      s: data.s,
    })
    PaymentSerde.required.forEach((field: string) => {
      if (!(field in data)) {
        throw new Error(`Required field not found: ${field}`)
      }
    })

    return new Payment({
      channelId: data.channelId,
      value: BigInt(String(data.value)),
      sender: data.sender,
      receiver: data.receiver,
      price: BigInt(String(data.price)),
      channelValue: BigInt(String(data.channelValue)),
      signature: sig.toString(),
      token: data.token,
      meta: data.meta,
      createdAt: Number(data.createdAt),
      tokenContract: data.tokenContract,
    })
  }
}
