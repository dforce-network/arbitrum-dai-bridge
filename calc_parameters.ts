
import { ethers } from 'hardhat'

import { getMaxGas, getMaxSubmissionPrice } from './arbitrum-helpers/bridge'
import { RetryProvider } from './arbitrum-helpers/networks/RetryProvider'

const callerAddress = "0xa945507cdf0020bB326f4bCE88c2EcDC14F1B739";
const abiCoder = new ethers.utils.AbiCoder();

async function main() {
    const onlyData = '0x'

    const l2Provider = new RetryProvider(5, 'https://rinkeby.arbitrum.io/rpc');
    const gasPriceBid = await l2Provider.getGasPrice();
    console.log("\n", "0. gasPriceBid is: ", gasPriceBid.toString());

    // Faked data.
    const depositCalldata = "0x2e567b36000000000000000000000000d546522efaef71f8f5d90b22b24595c14a7c12320000000000000000000000009316b708475c9976c9f3245c72bdc703fee1e3da0000000000000000000000009316b708475c9976c9f3245c72bdc703fee1e3da0000000000000000000000000000000000000000000000006124fee993bc000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const maxSubmissionPrice = await getMaxSubmissionPrice(l2Provider, depositCalldata)

    const maxGas = await getMaxGas(
        l2Provider,
        "0x009bda28aBE10e522e2B2013F40acf8Ce9273c68",
        "0xa945507cdf0020bB326f4bCE88c2EcDC14F1B739",
        callerAddress,
        maxSubmissionPrice,
        gasPriceBid,
        depositCalldata,
    )
    console.log("\n", "1. maxGas", maxGas.toString());

    const defaultData = abiCoder.encode(['uint256', 'bytes'], [maxSubmissionPrice, onlyData])
    console.log("\n", "2. defaultData", defaultData);

    const ethValue = await maxSubmissionPrice.add(gasPriceBid.mul(maxGas))
    console.log("\n", "3. ethValue", ethValue.toString());
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
