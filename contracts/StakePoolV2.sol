// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "./StakePool.sol";

contract StakePoolV2 is StakePool{

    mapping(address => uint256) public userTotalRewardsClaimed;

    uint256 public bonusMultiplier;

    // 设置奖励倍数

    function setBonusMultiplier(uint256 _multiplier) external onlyRole(ADMIN_ROLE) {

        require(_multiplier >= 100, "Multiplier must be >= 100");
        bonusMultiplier = _multiplier;

    }

    // 查询带倍数的待领取奖励

    function pendingMetaNodeWithBonus(uint256 _pid, address _user) external view validPool(_pid) returns (uint256) {
        uint256 basePending = this.pendingMetaNode(_pid, _user);
        return (basePending * bonusMultiplier) / 100;
    }


    // 领取带倍数的奖励

    function claimWithBonus(uint256 _pid) external whenClaimNotPaused whenNotPaused validPool(_pid) {
        Pool storage pool = Pools[_pid];
        User storage user = users[_pid][msg.sender];


        updataPoolReward(_pid);

        uint256 pending = ((user.stAmount * pool.accMetaNodePerST )/ 1e12) - user.finishedMetaNode;
        uint256 totalPending = pending + user.pendingMetaNode;

        require(totalPending > 0, "No pending rewards");

        user.finishedMetaNode = (user.stAmount * pool.accMetaNodePerST)/1e12;
        user.pendingMetaNode = 0;


        uint256 bonusAmount = (totalPending * bonusMultiplier) / 100;
        userTotalRewardsClaimed[msg.sender] += bonusAmount;

        metaNodeToken.transfer(msg.sender,totalPending);


    }

    // 获取合约版本

    function version() external pure returns (string memory) {
        return "2.0.0";
    }
}