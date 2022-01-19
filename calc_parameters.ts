import { ethers } from 'hardhat'

import { getMaxGas, getMaxSubmissionPrice } from './arbitrum-helpers/bridge'
import { RetryProvider } from './arbitrum-helpers/networks/RetryProvider'

const l1GatewayABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_l2Counterpart',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_l1Router',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_inbox',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_l1USX',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_l2USX',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_l1Escrow',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'Closed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'usr',
        type: 'address',
      },
    ],
    name: 'Deny',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'l1Token',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'sequenceNumber',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'DepositInitiated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'usr',
        type: 'address',
      },
    ],
    name: 'Rely',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'seqNum',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'TxToL2',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'l1Token',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'exitNum',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'WithdrawalFinalized',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'l1Token',
        type: 'address',
      },
    ],
    name: 'calculateL2TokenAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'close',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'counterpartGateway',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'usr',
        type: 'address',
      },
    ],
    name: 'deny',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'l1Token',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'finalizeInboundTransfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'l1Token',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'getOutboundCalldata',
    outputs: [
      {
        internalType: 'bytes',
        name: 'outboundCalldata',
        type: 'bytes',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'inbox',
    outputs: [
      {
        internalType: 'contract IInbox',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_l2Counterpart',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_l1Router',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_inbox',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_l1USX',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_l2USX',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_l1Escrow',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isOpen',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'l1Escrow',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'l1Router',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'l1USX',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'l2Counterpart',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'l2USX',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'l1Token',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxGas',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'gasPriceBid',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'outboundTransfer',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'usr',
        type: 'address',
      },
    ],
    name: 'rely',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'wards',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const l2OperatorAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
    ],
    name: 'addLiquidity',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
//rinkeby old
// const l1USXAddress = "0x2D76117C2C85c2E9C9FBF08199C9Be59af887526";
// const l1GatewayAddress = "0x6729B1425DF1750e14CEb171919c346f58014913";
// const l2GatewayAddress = "0x1B34daF9CBfAbcb7149b92cB23e1Ee2ecACd4D30";
// const l1GovernanceRelay = "0x2E76D200C6CbC8587090b4Ac8f4D0cB6d2F2188c";
// const l2GovernanceRelay = "0xF76eAd4da04BbeB97d29F83e2Ec3a621d0FB3c6e";

// Rinkeby applyL1ToL2Alias: 0x1aB97B9685557DDB1eD2c0F0ffF8A7009225981C
// Rinkeby inbox: 0x578BAde599406A8fE3d24Fd7f7211c0911F5B29e

// rinkeby new
const l1GatewayAddress = '0x9f94c5136A80B994AD53acfeF5e3F27609D221a8'
const l2GatewayAddress = '0x1e572B08e311C229FF8cfAaB0142e36474c3640D'
const l1USXAddress = '0x2D76117C2C85c2E9C9FBF08199C9Be59af887526'
const l1GovernanceRelay = '0x2E76D200C6CbC8587090b4Ac8f4D0cB6d2F2188c'
const l2GovernanceRelay = '0xF76eAd4da04BbeB97d29F83e2Ec3a621d0FB3c6e'
const abiCoder = new ethers.utils.AbiCoder()
const provider = ethers.getDefaultProvider('https://rinkeby.infura.io/v3/5b56b37c7e9844f7b58373cac2fafa1d')
const from = '0xae23214a5F188F5d3acF19B969BB386Ca5ca9335'
const to = '0xeB54706fc267B5dF368188bFa1Cd4D3761E6A4Af' // operator
const depositAmount = ethers.utils.parseEther('1220000')
const funcName = 'mint'
// const funcName = 'addLiquidity'
const funcArgs = [depositAmount]

async function main() {
  const onlyData = '0x'

  const l2Provider = new RetryProvider(5, 'https://rinkeby.arbitrum.io/rpc')
  // const l2Provider = new RetryProvider(5, 'https://arb1.arbitrum.io/rpc');
  const gasPriceBid = await l2Provider.getGasPrice()
  console.log('\n', '0. gasPriceBid is: ', gasPriceBid.toString())

  const l1Gateway = new ethers.Contract(l1GatewayAddress, l1GatewayABI, provider)
  const depositCalldata = await l1Gateway.getOutboundCalldata(l1USXAddress, from, to, depositAmount, onlyData)

  const maxSubmissionPrice = await getMaxSubmissionPrice(l2Provider, depositCalldata)
  console.log('maxSubmissionPrice', maxSubmissionPrice.toString())

  const maxGas = await getMaxGas(
    l2Provider,
    l1GatewayAddress,
    l2GatewayAddress,
    from,
    maxSubmissionPrice,
    gasPriceBid,
    depositCalldata,
  )

  console.log('\n', '1. maxGas', maxGas.toString())
  // console.log("\n", "1.1 maxGas1", maxGas1.toString());

  const iface = new ethers.utils.Interface(l2OperatorAbi)
  const calldata = iface.encodeFunctionData(funcName, funcArgs)
  const L2TxData = abiCoder.encode(['address', 'bytes'], [to, calldata])
  console.log('L2TxData', L2TxData.toString())

  const defaultData = abiCoder.encode(['uint256', 'bytes'], [maxSubmissionPrice, L2TxData])
  console.log('\n', '2. defaultData', defaultData)

  const ethValue = await maxSubmissionPrice.add(gasPriceBid.mul(maxGas))
  console.log('\n', '3. ethValue', ethValue.toString())

  // // When transfer tokens from L2 to L1, encode `messageNum` and `bytes`
  // const messageNum = 174004
  // // const L1Token = "0xd546522EfAeF71f8F5D90B22b24595c14a7C1232" // L1 DAI
  // const L1Token = "0x2D76117C2C85c2E9C9FBF08199C9Be59af887526" // L1 USX
  // const fromAddress = "0xba32bc6396152025608a37005d80e0346ab4740b"
  // const toAddress = "0xba32bc6396152025608a37005d80e0346ab4740b"
  // const amount = "2000000000000000000"
  // const functionHash = "2e567b36" // finalizeInboundTransfer(address,address,address,uint256,bytes)
  // const L2MessageData = abiCoder.encode(['uint256', 'bytes'], [messageNum, onlyData])
  // const encodeFunctionCallData = abiCoder.encode(
  //   ['address', 'address', 'address', 'uint256', 'bytes'],
  //   [L1Token,
  //     fromAddress,
  //     toAddress,
  //     amount,
  //     L2MessageData
  //   ]
  // )
  // console.log("\n", "4. When transfer tokens from L2 to L1 ,encode message is: ");
  // console.log("0x" + functionHash + encodeFunctionCallData.slice(2));
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
