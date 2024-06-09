// import Web3 from 'web3'
// import { BigNumber } from 'bignumber.js'
// import sinon from 'sinon'
// const contracts = require('@machinomy/contracts')
// import Signature from './Signature'
// import expect from 'expect'
// import ChannelId from './ChannelId'
// import ChannelTokenContract from './ChannelTokenContract'
// import asPromised from 'chai-as-promised'
// import chai from 'chai'
//
// chai.use(asPromised)
//
// const ID = '0x0e29e61f256b40b2a6280f8181a1b5ff'
// const RANDOM_ID = 'RANDOM'
// const SETTLEMENT_PERIOD = new BigNumber(1234)
// const RECEIVER = '0xRECEIVER'
// const VALUE = new BigNumber(10)
// const SENDER = '0xSENDER'
// const TOKEN_CONTRACT = '0x01e1a2626271c7267Dd8F506503AD0318776EF69'
// const SIG = Signature.fromRpcSig(
//   '0xd8a923b39ae82bb39d3b64d58f06e1d776bcbcae34e5b4a6f4a952e8892e6a5b4c0f88833c06fe91729057035161e599fda536e8ce0ab4be2c214d6ea961e93a01',
// )
//
// describe('ChannelTokenContract', () => {
//   const web3 = { currentProvider: {} } as Web3
//
//   let deployed: any
//   let contractStub: sinon.SinonStub
//   let contract: ChannelTokenContract
//   let channelIdStub: sinon.SinonStub
//   let tokenStub: sinon.SinonStub
//   let tokenDeployed: any
//
//   beforeEach(() => {
//     channelIdStub = sinon.stub(ChannelId, 'random').returns(RANDOM_ID)
//
//     deployed = {}
//     contractStub = sinon.stub(contracts.TokenUnidirectional, 'contract')
//     contractStub.withArgs(web3.currentProvider).returns({
//       deployed: sinon.stub().resolves(Promise.resolve(deployed)),
//     })
//
//     tokenDeployed = {}
//     tokenStub = sinon.stub(contracts.StandardToken, 'contract')
//     tokenStub.withArgs(web3.currentProvider).returns({
//       at: sinon.stub().resolves(Promise.resolve(tokenDeployed)),
//     })
//
//     contract = new ChannelTokenContract(web3, 0)
//   })
//
//   afterEach(() => {
//     contractStub.restore()
//     channelIdStub.restore()
//     tokenStub.restore()
//   })
//
//   describe('#open', () => {
//     specify('call contract', async () => {
//       deployed.open = sinon.stub()
//       tokenDeployed.approve = sinon
//         .stub()
//         .returns(Promise.resolve({ logs: [{ event: 'Approval' }] }))
//       await contract.open(
//         SENDER,
//         RECEIVER,
//         VALUE,
//         SETTLEMENT_PERIOD,
//         TOKEN_CONTRACT,
//         ID,
//       )
//       expect(
//         deployed.open.calledWith(
//           ID,
//           RECEIVER,
//           SETTLEMENT_PERIOD,
//           TOKEN_CONTRACT,
//           VALUE,
//           {
//             from: SENDER,
//             gas: 300000,
//           },
//         ),
//       ).toBeTruthy()
//     })
//
//     specify('throw error if can not approve', async () => {
//       deployed.open = sinon.stub()
//       tokenDeployed.approve = sinon.stub().returns(Promise.reject('error'))
//
//       return chai.assert.isRejected(
//         contract.open(
//           SENDER,
//           RECEIVER,
//           VALUE,
//           SETTLEMENT_PERIOD,
//           TOKEN_CONTRACT,
//           ID,
//         ),
//       )
//     })
//   })
//
//   describe('#claim', () => {
//     it('claims the channel', async () => {
//       deployed.claim = sinon.stub()
//       await contract.claim(RECEIVER, ID, VALUE, SIG)
//
//       expect(
//         deployed.claim.calledWith(ID, VALUE, SIG.toString(), {
//           from: RECEIVER,
//           gas: 300000,
//         }),
//       ).toBeTruthy()
//     })
//   })
//
//   describe('#deposit', () => {
//     it('deposits tokens into the channel', async () => {
//       deployed.deposit = sinon.stub()
//       deployed.isPresent = sinon.stub().returns(true)
//       tokenDeployed.approve = sinon
//         .stub()
//         .returns(Promise.resolve({ logs: [{ event: 'Approval' }] }))
//       deployed.channels = () => {
//         return { tokenContract: TOKEN_CONTRACT }
//       }
//       await contract.deposit(SENDER, ID, VALUE, TOKEN_CONTRACT)
//       expect(
//         deployed.deposit.calledWith(ID, VALUE, {
//           from: SENDER,
//           gas: 300000,
//         }),
//       ).toBeTruthy()
//     })
//   })
//
//   describe('#getState', () => {
//     it('eth: returns 0 if the channel is open', async () => {
//       contract.channelById = sinon
//         .stub()
//         .returns(
//           Promise.resolve([
//             SENDER,
//             RECEIVER,
//             VALUE,
//             SETTLEMENT_PERIOD,
//             new BigNumber(0),
//             TOKEN_CONTRACT,
//           ]),
//         )
//       deployed.isOpen = sinon.stub().withArgs(ID).resolves(true)
//       deployed.isSettling = sinon.stub().withArgs(ID).resolves(false)
//
//       let state = await contract.getState(ID)
//       expect(state).toBe(0)
//     })
//
//     it('eth: returns 1 if the channel is settling', async () => {
//       contract.channelById = sinon
//         .stub()
//         .returns(
//           Promise.resolve([
//             SENDER,
//             RECEIVER,
//             VALUE,
//             SETTLEMENT_PERIOD,
//             new BigNumber(10).plus(SETTLEMENT_PERIOD),
//             TOKEN_CONTRACT,
//           ]),
//         )
//       deployed.isOpen = sinon.stub().withArgs(ID).resolves(false)
//       deployed.isSettling = sinon.stub().withArgs(ID).resolves(true)
//
//       let state = await contract.getState(ID)
//       expect(state).toBe(1)
//     })
//   })
//
//   describe('#startSettle', () => {
//     it('eth: starts settling the channel', async () => {
//       deployed.startSettling = sinon.stub()
//
//       await contract.startSettle('acc', ID)
//       expect(
//         deployed.startSettling.calledWith(ID, { from: 'acc' }),
//       ).toBeTruthy()
//     })
//   })
//
//   describe('#finishSettle', () => {
//     it('eth: finishes settling the channel', async () => {
//       deployed.settle = sinon.stub()
//       await contract.finishSettle('acc', ID)
//       expect(
//         deployed.settle.calledWith(ID, { from: 'acc', gas: 400000 }),
//       ).toBeTruthy()
//     })
//   })
//
//   describe('#paymentDigest', () => {
//     it('return the digest', async () => {
//       let digest = await contract.paymentDigest(ID, VALUE, TOKEN_CONTRACT)
//       expect(digest).toBe(
//         '0xcf721b8f35dbe41e9e725466121f35e68c4c7b4330ee38e40cf5d0dffa131b71',
//       )
//     })
//   })
// })
