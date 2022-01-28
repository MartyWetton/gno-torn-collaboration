const { ethers } = require('hardhat')
const { expect } = require('chai')

const config = require('./test.config.json')
const { getSignerFromAddress } = require('./utils')

const ProposalState = {
  Pending: 0,
  Active: 1,
  Defeated: 2,
  Timelocked: 3,
  AwaitingExecution: 4,
  Executed: 5,
  Expired: 6,
}

describe('General functionality tests', () => {
  let torn = config.tokenAddresses.torn
  let gov
  let tornWhale
  let proposal

  //// HELPER FN
  let getToken = async (tokenAddress) => {
    return await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', tokenAddress)
  }

  let minewait = async (time) => {
    await ethers.provider.send('evm_increaseTime', [time])
    await ethers.provider.send('evm_mine', [])
  }

  before(async function () {
    tornWhale = await getSignerFromAddress(config.whales.torn)

    // deploy proposal
    const Proposal = await ethers.getContractFactory('CollaborationProposal')
    const [deployer] = await ethers.getSigners()
    proposal = await Proposal.connect(deployer).deploy()
  })

  describe('Proposal execution', () => {
    it('the proposal should be executed correctly', async () => {
      let response, id, state
      gov = (
        await ethers.getContractAt(
          'tornado-governance/contracts/v2-vault-and-gas/gas/GovernanceGasUpgrade.sol:GovernanceGasUpgrade',
          config.governance,
        )
      ).connect(tornWhale)

      const tornToken = (await getToken(torn)).connect(tornWhale)
      await tornToken.approve(gov.address, ethers.utils.parseEther('1000000'))

      await gov.lockWithApproval(ethers.utils.parseEther('26000'))

      response = await gov.propose(proposal.address, 'GNO Collaboration Proposal')
      id = await gov.latestProposalIds(tornWhale.address)
      state = await gov.state(id)

      let { events } = await response.wait()
      let args = events.find(({ event }) => event == 'ProposalCreated').args
      expect(args.id).to.be.equal(id)
      expect(args.proposer).to.be.equal(tornWhale.address)
      expect(args.target).to.be.equal(proposal.address)
      expect(args.description).to.be.equal('GNO Collaboration Proposal')
      expect(state).to.be.equal(ProposalState.Pending)

      await minewait((await gov.VOTING_DELAY()).add(1).toNumber())
      await expect(gov.castVote(id, true)).to.not.be.reverted
      state = await gov.state(id)
      expect(state).to.be.equal(ProposalState.Active)
      await minewait(
        (
          await gov.VOTING_PERIOD()
        )
          .add(await gov.EXECUTION_DELAY())
          .add(96400)
          .toNumber(),
      )
      state = await gov.state(id)
      expect(state).to.be.equal(ProposalState.AwaitingExecution)

      const multisigAddr = await proposal.MULTISIG()
      const multisigBalanceBefore = await tornToken.balanceOf(multisigAddr)

      await gov.execute(id)

      const amount = await proposal.AMOUNT()
      expect(await tornToken.balanceOf(multisigAddr)).to.be.equal(multisigBalanceBefore.add(amount))

      state = await gov.state(id)
      expect(state).to.be.equal(ProposalState.Executed)
    })
  })
})
