const { ethers } = require("hardhat");

async function main() {

    const proxyAddress = process.env.STAKE_POOL_PROXY_ADDRESS;
    
    const StakePoolV2 = await ethers.getContractFactory("StakePoolV2");
    const stakePool = StakePoolV2.attach(proxyAddress);

    // 检查版本
    const version = await stakePool.version();
    console.log("版本:", version); // 应该显示 "2.0.0"

    // 测试新功能
    const bonusMultiplier = await stakePool.bonusMultiplier();
    console.log("奖励倍数:", bonusMultiplier.toString());

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