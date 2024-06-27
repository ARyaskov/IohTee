// import ChannelId from './ChannelId'
// import * as support from './support'
// import Payment from './payment'
// import Signature from './Signature'
// import { PaymentChannel } from './PaymentChannel'
// import expect from 'expect'
// import {channelId} from "@riaskov/machinomy-contracts";
// import {randomBigInt} from "./support";
//
// describe('Payment', () => {
//   describe('.fromPaymentChannel', () => {
//     it('build Payment object', () => {
//       let payment = new Payment({
//         channelId: channelId(),
//         sender: '0xsender',
//         receiver: '0xreceiver',
//         price: randomBigInt(),
//         value: randomBigInt(),
//         channelValue: randomBigInt(),
//         meta: 'metaexample',
//         signature: Signature.fromParts({
//           v: 27,
//           r: '0x2',
//           s: '0x3',
//         }).toString(),
//         token: undefined,
//         tokenContract: '0x',
//       })
//       let paymentChannel = PaymentChannel.fromPayment(payment)
//       expect(paymentChannel.channelId).toBe(payment.channelId)
//       expect(paymentChannel.sender).toBe(payment.sender)
//       expect(paymentChannel.receiver).toBe(payment.receiver)
//       expect(paymentChannel.value).toEqual(payment.channelValue)
//     })
//   })
// })
