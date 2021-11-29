// Right click on the script name and hit "Run" to execute
async function main() {
  try {
    console.log("Running deployWithEthers script...");
    let tx;

    const deployerAddress = "";

    // Arbitrum
    const l1USXContractAddress = "0x0a5e677a6a24b2f1a2bf4f3bffc443231d2fdec8";
    const l2USXContractAddress = "0x641441c631e2F909700d2f41FD87F0aA6A6b4EDb";
    const l2msdControllerAddress = "0x38a5585d347E8DFc3965C1914498EAfbDeD7c5Ff";
    const l2RouterAddress = "0x5288c571Fd7aD117beA99bF60FE0846C4E84F933";
    let l1USXGatewayProxyAddress = "";
    let proxyAdminAddress = "";
    let l2USXGatewayImplAddress = "";
    let l2USXGatewayProxyAddress = "";
    let l1GovernanceRelayAddress = "";
    let l2GovernanceRelayImplAddress = "";
    let l2GovernanceRelayProxyAddress = "";

    // 'web3Provider' is a remix global variable object
    const signer = new ethers.providers.Web3Provider(web3Provider).getSigner();

    // 0. Deploys proxy admin.
    const proxyAdminName = "ProxyAdmin";
    const proxyAdminArtifactsPath = `browser/artifacts/contracts/library/${proxyAdminName}.sol/${proxyAdminName}.json`;
    const proxyAdminMetadata = JSON.parse(
      await remix.call("fileManager", "getFile", proxyAdminArtifactsPath)
    );

    if (!proxyAdminAddress) {
      console.log("U r going to deploy proxy admin");
      // Create an instance of a Contract Factory
      const proxyAdminFactory = new ethers.ContractFactory(proxyAdminMetadata.abi, proxyAdminMetadata.bytecode, signer);
      const proxyAdmin = await proxyAdminFactory.deploy();
      // The contract is NOT deployed yet; we must wait until it is mined
      await proxyAdmin.deployed();
      proxyAdminAddress = proxyAdmin.address;
    }
    console.log("proxy admin contract address: ", proxyAdminAddress);

    // 1.0 Deploy L2 governance rely implementation contract.
    const governanceRelayContractName = "L2GovernanceRelay";
    const governanceRelayPath = `browser/artifacts/contracts/l2/${governanceRelayContractName}.sol/${governanceRelayContractName}.json`;
    const governanceRelayMetadata = JSON.parse(
      await remix.call("fileManager", "getFile", governanceRelayPath)
    );

    let l2governanceRelayInitArgs = [
      l1GovernanceRelayAddress
    ];
    if (!l2GovernanceRelayImplAddress) {
      console.log("U r going to deploy governance relay implementation contract!");
      // Create an instance of a Contract Factory
      const governanceRelayImplFactory = new ethers.ContractFactory(governanceRelayMetadata.abi, governanceRelayMetadata.bytecode, signer);
      const governanceRelayImpl = await governanceRelayImplFactory.deploy(...l2governanceRelayInitArgs);
      // The contract is NOT deployed yet; we must wait until it is mined
      await governanceRelayImpl.deployed();
      l2GovernanceRelayImplAddress = governanceRelayImpl.address;
    }
    console.log("Governance relay implementation contract address: ", l2GovernanceRelayImplAddress);
    const governanceRelayInIface = new ethers.utils.Interface(governanceRelayMetadata.abi);

    // 1.1 Deploys L1 governance rely proxy contract.
    if (!l2GovernanceRelayProxyAddress) {
      console.log("Going to deploy governance relay proxy contract!");
      const governanceRelayInitData = governanceRelayInIface.encodeFunctionData("initialize", [...l2governanceRelayInitArgs]);
      console.log("initData is: ", governanceRelayInitData);

      const governanceRelayProxyFactory = new ethers.ContractFactory(proxyMetadata.abi, proxyMetadata.bytecode, signer);
      const governanceRelayProxy = await governanceRelayProxyFactory.deploy(l2GovernanceRelayImplAddress, proxyAdminAddress, governanceRelayInitData);
      await governanceRelayProxy.deployed();
      l2GovernanceRelayProxyAddress = governanceRelayProxy.address;
    }
    console.log("L2 governance realy proxy contract address: ", l2GovernanceRelayProxyAddress);

    // 2.0 Deploys L2 USX gateway implementation contract
    let l2USXGatewayInitArgs = [
      l1USXGatewayProxyAddress,
      l2RouterAddress,
      l1USXContractAddress,
      l2USXContractAddress,
      l2msdControllerAddress
    ];
    const l2USXGatewayContractName = "L2USXGateway";
    const l2USXGatewayPath = `browser/artifacts/contracts/l2/${l2USXGatewayContractName}.sol/${l2USXGatewayContractName}.json`;
    const l2USXGatewayMetadata = JSON.parse(
      await remix.call("fileManager", "getFile", l2USXGatewayPath)
    );
    if (!l2USXGatewayImplAddress) {
      console.log("U r going to deploy L2 USX gateway implementation contract!");
      // Create an instance of a Contract Factory
      const l2USXGatewayImplFactory = new ethers.ContractFactory(l2USXGatewayMetadata.abi, l2USXGatewayMetadata.bytecode, signer);
      const l2USXGatewayImpl = await l2USXGatewayImplFactory.deploy(...l2USXGatewayInitArgs);
      // The contract is NOT deployed yet; we must wait until it is mined
      await l2USXGatewayImpl.deployed();
      l2USXGatewayImplAddress = l2USXGatewayImpl.address;
    }
    console.log("L2 USX gateway implementation contract address: ", l2USXGatewayImplAddress);
    const l2USXGatewayInIface = new ethers.utils.Interface(l2USXGatewayMetadata.abi);

    // 2.1 Deploys L2 USX gateway proxy contract
    const proxyName = "TransparentUpgradeableProxy";
    const proxyArtifactsPath = `browser/artifacts/@openzeppelin/contracts/proxy/${proxyName}.sol/${proxyName}.json`;
    const proxyMetadata = JSON.parse(
      await remix.call("fileManager", "getFile", proxyArtifactsPath)
    );

    if (!l2USXGatewayProxyAddress) {
      console.log("Going to deploy L2 USX gateway proxy contract!");
      const l2USXGatewayInitData = l2USXGatewayInIface.encodeFunctionData("initialize", [...l2USXGatewayInitArgs]);
      console.log("l2 USX Gateway initData is: ", l2USXGatewayInitData);

      const l2USXGatewayProxyFactory = new ethers.ContractFactory(proxyMetadata.abi, proxyMetadata.bytecode, signer);
      const l2USXGatewayProxy = await l2USXGatewayProxyFactory.deploy(l2USXGatewayImplAddress, proxyAdminAddress, l2USXGatewayInitData);
      await l2USXGatewayProxy.deployed();
      l2USXGatewayProxyAddress = l2USXGatewayProxy.address;
    }
    console.log("L2 USX Gateway proxy contract address: ", l2USXGatewayProxyAddress);

    console.log("\n");
    console.log("Please run another script to deploy USX gateway on the L1");
    console.log("\n");

    console.log("Finish!");
  } catch (e) {
    console.log(e.message);
  }
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
