
// Right click on the script name and hit "Run" to execute
async function main() {
  try {
    console.log("Running deployWithEthers script...");
    let tx;

    const from = "0xbA32Bc6396152025608a37005D80E0346aB4740b";

    // Mainnet
    const l1USXContractAddress = "0x0a5e677a6a24b2f1a2bf4f3bffc443231d2fdec8";
    const l2USXContractAddress = "0x641441c631e2F909700d2f41FD87F0aA6A6b4EDb";
    const l1RouterAddress = "0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef";
    const inboxAddress = "0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f";
    let l2USXGatewayProxyAddress = "";
    let proxyAdminAddress = "";
    let escrowImplContractAddress = "";
    let escrowProxyContractAddress = "";
    let l1USXGatewayImplAddress = "";
    let l1USXGatewayProxyAddress = "";

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

    // 1.0 Deploys escrow implementation contract
    const escrowContractName = "L1Escrow";
    const escrowPath = `browser/artifacts/contracts/l1/${escrowContractName}.sol/${escrowContractName}.json`;
    const escrowMetadata = JSON.parse(
      await remix.call("fileManager", "getFile", escrowPath)
    );
    if (!escrowImplContractAddress) {
      console.log("U r going to deploy escrow implementation contract!");
      // Create an instance of a Contract Factory
      const escrowImplFactory = new ethers.ContractFactory(escrowMetadata.abi, escrowMetadata.bytecode, signer);
      const escrowImpl = await escrowImplFactory.deploy();
      // The contract is NOT deployed yet; we must wait until it is mined
      await escrowImpl.deployed();
      escrowImplContractAddress = escrowImpl.address;
    }
    console.log("Escrow implementation contract address: ", escrowImplContractAddress);
    const escrowInIface = new ethers.utils.Interface(escrowMetadata.abi);

    // 1.1 Deploys escrow proxy contract
    const proxyName = "TransparentUpgradeableProxy";
    const proxyArtifactsPath = `browser/artifacts/@openzeppelin/contracts/proxy/${proxyName}.sol/${proxyName}.json`;
    const proxyMetadata = JSON.parse(
      await remix.call("fileManager", "getFile", proxyArtifactsPath)
    );

    if (!escrowProxyContractAddress) {
      console.log("Going to deploy escrow proxy contract!");
      const escrowInitData = escrowInIface.encodeFunctionData("initialize", []);
      console.log("initData is: ", escrowInitData);

      const escrowProxyFactory = new ethers.ContractFactory(proxyMetadata.abi, proxyMetadata.bytecode, signer);
      const escrowProxy = await escrowProxyFactory.deploy(escrowImplContractAddress, proxyAdminAddress, escrowInitData);
      await escrowProxy.deployed();
      escrowProxyContractAddress = escrowProxy.address;
    }
    console.log("Escrow proxy contract address: ", escrowProxyContractAddress);

    // 2. Get current nonce to calculate contract address of next deployed contract.
    const nonce = await signer.getTransactionCount() + 1;
    console.log("Deployer next nonce is: ", nonce);
    const addressOfNextDeployedContract = ethers.utils.getContractAddress({ from, nonce });
    console.log("Next deploy contract address is: ", addressOfNextDeployedContract);

    console.log("\nRun another script to deploy contract on the L2\n");
    return;

    // 3.0 Deploys L1 USX gateway implementation contract
    let l1USXGatewayInitArgs = [
      l2USXGatewayProxyAddress,
      l1RouterAddress,
      inboxAddress,
      l1USXContractAddress,
      l2USXContractAddress,
      escrowProxyContractAddress
    ];
    const l1USXGatewayContractName = "L1USXGateway";
    const l1USXGatewayPath = `browser/artifacts/contracts/l1/${l1USXGatewayContractName}.sol/${l1USXGatewayContractName}.json`;
    const l1USXGatewayMetadata = JSON.parse(
      await remix.call("fileManager", "getFile", l1USXGatewayPath)
    );
    if (!l1USXGatewayImplAddress) {
      console.log("U r going to deploy L1 USX gateway implementation contract!");
      // Create an instance of a Contract Factory
      const l1USXGatewayImplFactory = new ethers.ContractFactory(l1USXGatewayMetadata.abi, l1USXGatewayMetadata.bytecode, signer);
      const l1USXGatewayImpl = await l1USXGatewayImplFactory.deploy(...l1USXGatewayInitArgs);
      // The contract is NOT deployed yet; we must wait until it is mined
      await l1USXGatewayImpl.deployed();
      l1USXGatewayImplAddress = l1USXGatewayImpl.address;
    }
    console.log("L1 USX gateway implementation contract address: ", l1USXGatewayImplAddress);
    const l1USXGatewayInIface = new ethers.utils.Interface(l1USXGatewayMetadata.abi);

    // 3.1 Deploys L2 USX gateway proxy contract
    if (!l1USXGatewayProxyAddress) {
      console.log("Going to deploy L1 USX gateway proxy contract!");
      const l1USXGatewayInitData = l1USXGatewayInIface.encodeFunctionData("initialize", [...l1USXGatewayInitArgs]);
      console.log("l1 USX Gateway initData is: ", l1USXGatewayInitData);

      const l1USXGatewayProxyFactory = new ethers.ContractFactory(proxyMetadata.abi, proxyMetadata.bytecode, signer);
      const l1USXGatewayProxy = await l1USXGatewayProxyFactory.deploy(l1USXGatewayImplAddress, proxyAdminAddress, l1USXGatewayInitData);
      await l1USXGatewayProxy.deployed();
      l1USXGatewayProxyAddress = l1USXGatewayProxy.address;
    }
    console.log("L1 USX Gateway proxy contract address: ", l1USXGatewayProxyAddress);

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
