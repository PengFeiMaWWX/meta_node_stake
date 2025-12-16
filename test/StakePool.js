const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers }  = require("hardhat");
const { expect } = require("chai");

describe("StakePool",async function () {
    async function deployTokenFixtrue() {
        const [owner,user1,user2,user3] = await ethers.getSigners();

        const MetaNodeToken = await ethers.getContractFactory("MetaNodeToken");
        const metaNodeToken = await MetaNodeToken.deploy()

        const TestToken = await ethers.getContractFactory("TestToken");
        const testToken = await TestToken.deploy("Test Token", "TEST", 18, 1000000)

        const StakePool = await ethers.getContractFactory("StakePool");
        const stakePool = await StakePool.deploy()

        const metaNodePerBlock = ethers.parseEther("10");
        const startBlock = await ethers.provider.getBlockNumber()+1;

        await stakePool.initialize(
            await metaNodeToken.getAddress(),
            metaNodePerBlock,
            startBlock
        );

        await metaNodeToken.transfer(stakePool.getAddress(),ethers.parseEther("100000"));

        await testToken.transfer(user1.address,ethers.parseEther("1000"));
        await testToken.transfer(user2.address,ethers.parseEther("1000"));
        await testToken.transfer(user3.address,ethers.parseEther("1000"));


        return {
            stakePool,metaNodeToken,testToken,metaNodePerBlock,startBlock,owner,user1,user2,user3
        }




    }


    // describe("deployment",async function () {

    //     it("initialize",async function () {
    //         const {metaNodeToken,stakePool,metaNodePerBlock,owner} = await loadFixture(deployTokenFixtrue);


    //         expect(await stakePool.metaNodeToken()).to.equal(await metaNodeToken.getAddress());
    //         expect(await stakePool.metaNodePerBlock()).to.equal(metaNodePerBlock);
    //         expect(await stakePool.totalPoolWeight()).to.equal(0);

    //         const ADMIN_ROLE = await stakePool.ADMIN_ROLE();
    //         const UPGRADER_ROLE =  await stakePool.UPGRADER_ROLE();
    //         const OPERATOR_ROLE = await stakePool.OPERATOR_ROLE();

    //         expect(await stakePool.hasRole(ADMIN_ROLE,owner.address)).to.be.true;
    //         expect(await stakePool.hasRole(UPGRADER_ROLE,owner.address)).to.be.true;
    //         expect(await stakePool.hasRole(OPERATOR_ROLE,owner.address)).to.be.true;

    //     });
        
    // });
    // describe("Pool Management",async function () {
    //     it("Should add a native currency pool",async function () {
    //         const {stakePool} = await loadFixture(deployTokenFixtrue);

    //         const poolweight = 100;
    //         const minDepositAmount = ethers.parseEther("0.1");
    //         const unstakeLockedBlocks = 100;


    //         await stakePool.addPool(
    //             ethers.ZeroAddress,
    //             poolweight,
    //             minDepositAmount,
    //             unstakeLockedBlocks
    //         );


    //         const pool =await stakePool.Pools(0);

    //         expect(pool.stTokenAddress).equal(ethers.ZeroAddress);
    //         expect(pool.poolWeight).equals(poolweight);
    //         expect(pool.minDepositAmount).equals(minDepositAmount);
    //         expect(pool.unstakeLockedBlocks).equals(unstakeLockedBlocks);
    //         expect(pool.isActive).ordered.be.true;
    //         expect(await stakePool.totalPoolWeight()).equal(poolweight);



    //     });

    //     it("add ERC20",async function () {
    //         const {stakePool,testToken} = await loadFixture(deployTokenFixtrue);

    //         const poolweight = 100;
    //         const minDepositAmount = ethers.parseEther("0.1");
    //         const unstakeLockedBlocks = 100;


    //         await stakePool.addPool(
    //             await testToken.getAddress(),
    //             poolweight,
    //             minDepositAmount,
    //             unstakeLockedBlocks
    //         );


    //         const pool =await stakePool.Pools(0);

    //         expect(pool.stTokenAddress).equal(await testToken.getAddress());
        
            


    //     });

    //     it("update pool parameters",async function () {
    //         const {stakePool,testToken} = await loadFixture(deployTokenFixtrue);

    //         await stakePool.addPool(
    //             await testToken.getAddress(),
    //             100,
    //             ethers.parseEther("0.2"),
    //             100
    //         );

    //         const poolweight1 = 102;
    //         const minDepositAmount1 = ethers.parseEther("0.8");
    //         const unstakeLockedBlocks1 = 105;



    //         await stakePool.upataPool(0,poolweight1,minDepositAmount1,unstakeLockedBlocks1);
    //         const pool =await stakePool.Pools(0);
    //         expect(pool.poolWeight).equals(poolweight1);
    //         expect(pool.minDepositAmount).equals(minDepositAmount1);
    //         expect(pool.unstakeLockedBlocks).equals(unstakeLockedBlocks1);

            

    //     });

    //     it("not admain",async function () {
    //         const {stakePool,user1,testToken} = await loadFixture(deployTokenFixtrue);

    //         await expect(stakePool.connect(user1).addPool(
    //             await testToken.getAddress(),
    //             100,
    //             ethers.parseEther("0.3"),
    //             100
    //         )
    //         ).to.be.reverted;
            

            



        

            

    //     });



    // });
    // describe("Staking",async function () {
    //     async function setupPoolsFixture() {
    //         const fixture = await loadFixture(deployTokenFixtrue);

    //         await fixture.stakePool.addPool(
    //             ethers.ZeroAddress,
    //             100,
    //             ethers.parseEther("0.1"),
    //             100
    //         );

    //         await fixture.stakePool.addPool(
    //             await fixture.testToken.getAddress(),
    //             200,
    //             ethers.parseEther("10"),
    //             200
    //         );

    //         return fixture;


    //     }

    //     it("Should stake native currency",async function () {
    //         const {stakePool,user1} = await loadFixture(setupPoolsFixture);


    //         const stakeAmount = ethers.parseEther("1");
    //         await stakePool.connect(user1).stake(0,stakeAmount,{value:stakeAmount});

    //         const userINfo = await stakePool.getUserInfo(0,user1.address);
    //         expect(userINfo.stAmount).to.equal(stakeAmount);

    //         const pool = await stakePool.Pools(0);

    //         expect(pool.stTokenAmount).to.equal(stakeAmount);

    //     });

    //     it("Should stake ERC20 tokens",async function () {
    //         const {stakePool,user1,testToken} = await loadFixture(setupPoolsFixture);

    //         const stakeAmount = ethers.parseEther("100");

    //         await testToken.connect(user1).approve(await stakePool.getAddress(),stakeAmount);

            
    //         await stakePool.connect(user1).stake(1,stakeAmount);

    //         const userINfo = await stakePool.getUserInfo(1,user1.address);
    //         expect(userINfo.stAmount).to.equal(stakeAmount);

            

    //     });


    //     it("Should fail to stake below minimum deposit",async function () {
    //         const {stakePool,user1,} = await loadFixture(setupPoolsFixture);

    //         const stakeAmount = ethers.parseEther("0.05");

            

            
            
    //         await expect(stakePool.connect(user1).stake(0,stakeAmount,{value:stakeAmount}))
    //             .to.be.revertedWith("Amount below minimum deposit");

            

    //     });

    //     it("Should fail to stake with incorrect ETH amount",async function () {
    //         const {stakePool,user1,} = await loadFixture(setupPoolsFixture);

    //         const stakeAmount = ethers.parseEther("1");
    //         const wrongETHAmount = ethers.parseEther("0.5");


            

            
            
    //         await expect(stakePool.connect(user1).stake(0,stakeAmount,{value:wrongETHAmount}))
    //             .to.be.revertedWith("Invalid ETH amount");

            

    //     });







    // });

    // describe("Unstaking and Withdrawal",function () {
    //     async function setupPoolsFixture() {
    //         const fixture = await loadFixture(deployTokenFixtrue);

    //         await fixture.stakePool.addPool(
    //             ethers.ZeroAddress,
    //             100,
    //             ethers.parseEther("0.1"),
    //             100
    //         );

    //         await fixture.stakePool.addPool(
    //             await fixture.testToken.getAddress(),
    //             200,
    //             ethers.parseEther("10"),
    //             200
    //         );

    //         await fixture.stakePool.connect(fixture.user1).stake(0,ethers.parseEther("2"),{value:ethers.parseEther("2")});

    //         await fixture.testToken.connect(fixture.user1).approve(
    //             await fixture.stakePool.getAddress(),
    //             ethers.parseEther("200")
    //         );

    //         await fixture.stakePool.connect(fixture.user1).stake(1,ethers.parseEther("200"));


    //         return fixture;


    //     }

    //     it("Should unstake tokens",async function () {
    //         const {stakePool,user1} = await loadFixture(setupPoolsFixture);

    //         const unstakeAmount  = ethers.parseEther("1");

    //         await stakePool.connect(user1).unstake(0,unstakeAmount);

    //         const userINfo = await stakePool.getUserInfo(0,user1.address);
    //         expect(userINfo.stAmount).to.equal(ethers.parseEther("1"));

    //         expect(userINfo.requests).to.have.length(1);

    //         expect(userINfo.requests[0].unstakeLockedAmount).to.equal(unstakeAmount);

    //     });


    //     it("Should withdraw after lock period",async function () {
    //         const {stakePool,user1} = await loadFixture(setupPoolsFixture);
    //         const unstakeAmount  = ethers.parseEther("1");

    //         await stakePool.connect(user1).unstake(0,unstakeAmount);

    //         const userINfo = await stakePool.getUserInfo(0,user1.address);

    //         const unlockBlock = Number(userINfo.requests[0].unstakeLockedBlock);
    //         let currentBlock = await ethers.provider.getBlockNumber();

    //         console.log(`Need to wait from block ${currentBlock} to ${unlockBlock}`);

    //         // 等待直到解锁
    //         while (currentBlock < unlockBlock) {
    //             await ethers.provider.send("evm_mine");
    //             currentBlock++;
    //         }

    //         const balanceBefor = await ethers.provider.getBalance(user1.address);    

    //         await stakePool.connect(user1).withdraw(0);

    //         const balanceAfter = await ethers.provider.getBalance(user1.address);

    //          expect(balanceAfter).to.be.gt(balanceBefor);    

    //         const finalUserInfo = await stakePool.getUserInfo(0, user1.address);
    //         expect(finalUserInfo.requests).to.have.length(0);     

    //     });
    //     it("Should not withdraw before lock period",async function () {
    //         const {stakePool,user1} = await loadFixture(setupPoolsFixture);

    //         const unstakeAmount  = ethers.parseEther("1");
    //         await stakePool.connect(user1).unstake(0,unstakeAmount);

    //         await expect(stakePool.connect(user1).withdraw(0)).to.be.revertedWith("No withdrawable amount");


    //     });

    //     it("Should handle multiple unstake requests", async function () {
            
    //         const {stakePool,user1} = await loadFixture(setupPoolsFixture);
            
    //         // Make multiple unstake requests
    //         await stakePool.connect(user1).unstake(0, ethers.parseEther("0.5"));
    //         await stakePool.connect(user1).unstake(0, ethers.parseEther("0.3"));
    //         await stakePool.connect(user1).unstake(0, ethers.parseEther("0.2"));
            
    //         const userInfo = await stakePool.getUserInfo(0, user1.address);
    //         expect(userInfo.requests).to.have.length(3);
    //         expect(userInfo.stAmount).to.equal(ethers.parseEther("1")); // 2 - 1
    //     });
    //     it("Should emergency withdraw", async function () {
    //         const {stakePool,user1} = await loadFixture(setupPoolsFixture);
            
    //         const stakedAmount = ethers.parseEther("2");
    //         const balanceBefore = await ethers.provider.getBalance(user1.address);
            
    //         await stakePool.connect(user1).emergencyWithdraw(0);
            
    //         const balanceAfter = await ethers.provider.getBalance(user1.address);
    //         expect(balanceAfter).to.be.gt(balanceBefore);
            
    //         // Check user data is cleared
    //         const userInfo = await stakePool.getUserInfo(0, user1.address);
    //         expect(userInfo.stAmount).to.equal(0);
    //         expect(userInfo.requests).to.have.length(0);
    //     });


        




    // });


    describe("Rewards", function () {

        async function setupPoolsFixture() {
            const fixture = await loadFixture(deployTokenFixtrue);

            await fixture.stakePool.addPool(
                ethers.ZeroAddress,
                100,
                ethers.parseEther("0.1"),
                100
            );

            
            await fixture.stakePool.connect(fixture.user1).stake(0,ethers.parseEther("1"),{value:ethers.parseEther("1")});
            return fixture;


        }

        it("Should calculate pending rewards correctly", async function () {
           const {stakePool,user1} = await loadFixture(setupPoolsFixture);
            
            // Mine some blocks
            for (let i = 0; i < 5; i++) {
                await ethers.provider.send("evm_mine");
            }
            
            const pendingRewards = await stakePool.pendingMetaNode(0, user1.address);
            
            // Should be approximately metaNodePerBlock * blocks (accounting for pool weight)
            expect(pendingRewards).to.be.gt(0);
        });

        it("Should claim rewards", async function () {
            
            const {stakePool,user1,metaNodeToken} = await loadFixture(setupPoolsFixture);

            
            
    
            
            
            // Mine some blocks to accumulate rewards
            for (let i = 0; i < 10; i++) {
                await ethers.provider.send("evm_mine");
            }

            // console.log(await ethers.provider.getBlockNumber());
            
            const balanceBefore = await metaNodeToken.balanceOf(user1.address);
            const pendingBefore = await stakePool.pendingMetaNode(0, user1.address);

            console.log(balanceBefore,pendingBefore);

            
            
            await stakePool.connect(user1).claim(0);
            
            
            
            
            const balanceAfter = await metaNodeToken.balanceOf(user1.address);
            
            
            expect(balanceAfter).to.be.gt(balanceBefore);
            
            // // Pending should be reset to 0 (or very small due to block mining)
            const pendingAfter = await stakePool.pendingMetaNode(0, user1.address);
            expect(pendingAfter).to.be.lt(pendingBefore);
            
        });

        it("Should distribute rewards proportionally among users", async function () {
            const { stakePool, user1, user2} = await loadFixture(setupPoolsFixture);
            
            // User2 stakes double the amount of user1
            await stakePool.connect(user2).stake(0, ethers.parseEther("2"), { 
                value: ethers.parseEther("2") 
            });
            
            // Mine some blocks
            for (let i = 0; i < 10; i++) {
                await ethers.provider.send("evm_mine");
            }
            
            const pending1 = await stakePool.pendingMetaNode(0, user1.address);
            const pending2 = await stakePool.pendingMetaNode(0, user2.address);
            console.log(pending1,pending2);
            
            
            // User2 should have approximately double the rewards of user1
            const ratio = pending2 * BigInt(100) / pending1;
            expect(ratio).to.be.approximately(200, 50); // Allow some tolerance
        });





    });


    describe("Pause Functionality", function () {

        async function setupPoolsFixture() {
            const fixture = await loadFixture(deployTokenFixtrue);

            await fixture.stakePool.addPool(
                ethers.ZeroAddress,
                100,
                ethers.parseEther("0.1"),
                100
            );

            
           
            return fixture;


        }


         it("Should pause and unpause staking", async function () {
            const { stakePool, user1 } = await loadFixture(setupPoolsFixture);
            
            // Pause staking
            await stakePool.setStakePaused(true);
            
            

            await expect(stakePool.connect(user1).stake(0, ethers.parseEther("1"), { 
                value: ethers.parseEther("1") 
            })).to.be.revertedWith("Stake is paused");
            
            // Unpause staking
            await stakePool.setStakePaused(false);

            await stakePool.connect(user1).stake(0, ethers.parseEther("1"), { 
                value: ethers.parseEther("1") 
            })

            
            
            
        });

         it("Should pause entire contract", async function () {
            const { stakePool, user1 } = await loadFixture(setupPoolsFixture);
            
            // Stake first
            await stakePool.connect(user1).stake(0, ethers.parseEther("1"), { 
                value: ethers.parseEther("1") 
            });
            
            // Pause contract
            await stakePool.pause();
            
            // Should revert when paused (using custom error or reason string)
            await expect(stakePool.connect(user1).unstake(0, ethers.parseEther("0.5")))
                .to.be.reverted;
            
            // Unpause
            await stakePool.unpause();
            
            
        });



    });


    describe("Access Control", function () {
        it("Should not allow non-admin to set parameters", async function () {
            const { stakePool, user1 } = await loadFixture(deployTokenFixtrue);
            
            await expect(stakePool.connect(user1).setMetaNodePerBlock(ethers.parseEther("20")))
                .to.be.reverted;
            
            await expect(stakePool.connect(user1).setPoolActive(0, false))
                .to.be.reverted;
        });
        
        it("Should not allow non-operator to pause", async function () {
            const { stakePool, user1 } = await loadFixture(deployTokenFixtrue);
            
            await expect(stakePool.connect(user1).pause())
                .to.be.reverted;
            
            await expect(stakePool.connect(user1).setStakePaused(true))
                .to.be.reverted;
        });
    });

    
    




});