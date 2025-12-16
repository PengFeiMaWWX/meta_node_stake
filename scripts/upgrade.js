require("dotenv").config();
const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    // const PROXY_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";

    const PROXY_ADDRESS = process.env.STAKE_POOL_PROXY_ADDRESS;

    if (!PROXY_ADDRESS) {
        console.error("Please set STAKE_POOL_PROXY_ADDRESS environment variable");
        process.exit(1);
    }


    const StakePoolV2 = await ethers.getContractFactory("StakePoolV2");
    const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, StakePoolV2);


    try {
        const version = await upgraded.version();
        console.log("Contract version:", version);
        
        const bonusMultiplier = await upgraded.bonusMultiplier();
        console.log("Bonus multiplier:", bonusMultiplier.toString());
        
        console.log("✅ Upgrade completed and verified!");
        
    } catch (error) {
        console.error("❌ Upgrade verification failed:", error.message);
    }


    const upgradeInfo = {
        network: "sepolia",
        upgrader: deployer.address,
        blockNumber: await ethers.provider.getBlockNumber(),
        timestamp: new Date().toISOString(),
        proxyAddress: PROXY_ADDRESS,
        newImplementation: "StakePoolV2",
        version: "2.0.0"
    };


     const fs = require('fs');
    const path = require('path');
    const upgradeFile = path.join(__dirname, '../deployments', `upgrade-${Date.now()}.json`);

    fs.writeFileSync(upgradeFile, JSON.stringify(upgradeInfo, null, 2));

     console.log("📝 Upgrade info saved to:", upgradeFile);
    
}

if(require.main === module){


    main()
        .then(()=>process.exit(0))
        .catch((error) => {
                console.error(error);
                process.exit(1);
        });

}
