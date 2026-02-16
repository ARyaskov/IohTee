import { randomBytes } from 'node:crypto'

export default class ChannelId {
  readonly id: Buffer

  constructor(buffer: Buffer) {
    this.id = buffer
  }

  static random(): ChannelId {
    return new ChannelId(randomBytes(16))
  }

  static build(something: string | Buffer | ChannelId): ChannelId {
    if (typeof something === 'string') {
      const noPrefix = something.replace(/^0x/, '')
      const buffer = Buffer.from(noPrefix, 'hex')
      return new ChannelId(buffer)
    }

    if (Buffer.isBuffer(something)) {
      return new ChannelId(something)
    }

    if (something instanceof ChannelId) {
      return something
    }

    throw new Error(`Can not transform ${String(something)} to ChannelId`)
  }

  toString(): `0x${string}` {
    return `0x${this.id.toString('hex')}`
  }
}
