const { ethers, upgrades } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();


    const MetaNodeToken = await ethers.getContractFactory("MetaNodeToken");
    const metaNodeToken = await MetaNodeToken.deploy()
    await metaNodeToken.waitForDeployment();
    const metaNodeTokenAddress = await metaNodeToken.getAddress();


    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy("Test Token", "TEST", 18, 1000000)
    await testToken.waitForDeployment();
    const testTokenAddress = await testToken.getAddress();

    // Deploy StakePool as upgradeable proxy
    const StakePool = await ethers.getContractFactory("StakePool");

    const metaNodePerBlock = ethers.parseEther("10");
    const startBlock = await ethers.provider.getBlockNumber()+100;
    
    const stakePool = await upgrades.deployProxy(
        StakePool,
        [metaNodeTokenAddress,metaNodePerBlock,startBlock],
        { initializer: 'initialize' }
    );
    await stakePool.waitForDeployment();
    const stakePoolAddress = await stakePool.getAddress();


    await metaNodeToken.transfer(stakePoolAddress,ethers.parseEther("100000"));


    const ethPoolWeight = 100;
    const ethMinDeposit = ethers.parseEther("0.01"); // 0.01 ETH minimum
    const ethLockBlocks = 6500; // ~24 hours at 13s per block

    await stakePool.addPool(
        ethers.ZeroAddress, // Native ETH
        ethPoolWeight,
        ethMinDeposit,
        ethLockBlocks
    );


    const testTokenPoolWeight = 200;
    const testTokenMinDeposit = ethers.parseEther("100"); // 100 TEST tokens minimum
    const testTokenLockBlocks = 13000; // ~48 hours
    
    await stakePool.addPool(
        testTokenAddress,
        testTokenPoolWeight,
        testTokenMinDeposit,
        testTokenLockBlocks
    );

    const poolLength = await stakePool.getPoolLength();
    const totalWeight = await stakePool.totalPoolWeight();
    const metaPerBlock = await stakePool.metaNodePerBlock();



    const deploymentInfo={
        network: "sepolia",
        deployer: deployer.address,
        blockNumber: await ethers.provider.getBlockNumber(),
        timestamp: new Date().toISOString(),
        constract: {
            MetaNodeToken:{
                address: metaNodeTokenAddress,
                name: "MetaNode Token",
                symbol: "MMT"
            },
            TestToken: {
                address: testTokenAddress,
                name: "Test Token",
                symbol: "TEST"

            },
            StakePool: {
                address : stakePoolAddress,
                metaNodePerBlock : ethers.formatEther(metaPerBlock),
                startBlock: startBlock.toString(),
                Pools:[
                    {
                        id: 0,
                        token: "ETH",
                        address: ethers.ZeroAddress,
                        weight: ethPoolWeight,
                        minDeposit: ethers.formatEther(ethMinDeposit),
                        lockBlocks: ethLockBlocks
                    },
                    {
                        id: 1,
                        token: "TEST",
                        address: testTokenAddress,
                        weight: testTokenPoolWeight,
                        minDeposit: ethers.formatEther(testTokenMinDeposit),
                        lockBlocks: testTokenLockBlocks
                    }
                ]
            }
        }

    };


    const fs = require('fs');
    const path = require('path');
    
    const deploymentDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentDir, `sepolia-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    return {
        metaNodeToken: metaNodeTokenAddress,
        testToken: testTokenAddress,
        stakePool: stakePoolAddress
    };




}


if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;