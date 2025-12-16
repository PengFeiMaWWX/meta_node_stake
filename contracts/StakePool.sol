// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./MetaNodeToken.sol";



contract StakePool is AccessControl,Pausable,Initializable{

    using SafeERC20 for IERC20;

    /// @notice 管理员角色，可以管理池、修改参数
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE"); 

    /// @notice 升级者角色，可以升级合约
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @notice 操作员角色，可以暂停/恢复操作
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // 质押池结构体
    struct Pool {

        address stTokenAddress;         /// 代币地址
        uint256 poolWeight;             /// 池权重
        uint256 latRewardBlock;         /// 上次奖励计算的区块号
        uint256 accMetaNodePerST;       /// 每个质押代币累积的metanode奖励
        uint256 stTokenAmount;          /// 池中总的质押数量
        uint256 minDepositAmount;       /// 最小质押数量
        uint256 unstakeLockedBlocks;    /// 解质押锁定区块数
        bool isActive;                  /// 池激活状态

    }
    
    // 解除质押结构体

    struct UnstakeRequest {
        uint256 unstakeLockedAmount;        /// 解质押数量
        uint256 unstakeLockedBlock;         /// 解质押区块号
    }
    // 用户结构体
    struct User {
        uint256 stAmount;               /// 用户质押数量
        uint256 finishedMetaNode;       /// 已结算的metanode奖励
        uint256 pendingMetaNode;        /// 待领取的metanode奖励
        UnstakeRequest[] requests;      /// 解质押请求列表

    }

    // metanode 奖励合约代币地址
    MetaNodeToken public metaNodeToken;
    // 每一个区块给的metanode奖励
    uint256 public metaNodePerBlock;
    // 开始昌盛奖励的区块号
    uint256 public startBlock;

    // 总的质押权重
    uint256 public totalPoolWeight;

    // 质押池
    Pool[] public Pools;
    // 用户信息 pid-用户地址-用户信息
    mapping(uint256 => mapping(address => User))  public users;

    // 
    bool public stakePaused;
    bool public unstakePaused;
    bool public claimePaused;

    modifier validPool(uint256 _pid) {
        require(_pid < Pools.length, "Invalid pool ID");
        require(Pools[_pid].isActive, "Pool is not active");
        _;
    }

    modifier whenStakeNotPaused() {
        require(!stakePaused, "Stake is paused");
        _;
    }

    modifier whenUnStakeNotPaused() {
        require(!unstakePaused, "Stake is paused");
        _;
    }

    modifier whenClaimNotPaused() {
        require(!claimePaused, "Stake is paused");
        _;
    }









    // 初始化
    function initialize(
        MetaNodeToken _MetaNodeToken,
        uint256 _metaNodePerBlock,
        uint256 _startBlock
    ) public initializer{

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);



        metaNodeToken = _MetaNodeToken;
        metaNodePerBlock = _metaNodePerBlock;
        startBlock = _startBlock >0 ? _startBlock : block.number;
        
    }




    // 添加新的质押池
    function addPool(
        address _stTokenAddress,
        uint256 _poolWeight,
        uint256 _minDepositAmount,
        uint256 _unstakeLockedBlocks

    ) external onlyRole(ADMIN_ROLE){
        massUpdataPools();


        totalPoolWeight += _poolWeight;


        
        Pools.push(Pool({
            stTokenAddress: _stTokenAddress,         /// 代币地址
            poolWeight: _poolWeight,             /// 池权重
            latRewardBlock: block.number > startBlock ? block.number : startBlock,         /// 上次奖励计算的区块号
            accMetaNodePerST:0,       /// 每个质押代币累积的metanode奖励
            stTokenAmount:0,          /// 池中总的质押数量
            minDepositAmount:_minDepositAmount,      /// 最小质押数量
            unstakeLockedBlocks:_unstakeLockedBlocks,    /// 解质押锁定区块数
            isActive:true                  /// 池激活状态
        }));


    }


    // 更新质押池

    function upataPool(
        uint256 _pid,
        uint256 _poolWeight,
        uint256 _minDepositAmount,
        uint256 _unstakeLockedBlocks

    ) external onlyRole(ADMIN_ROLE) validPool(_pid){
        massUpdataPools();
        Pool storage pool = Pools[_pid];

        totalPoolWeight = totalPoolWeight - pool.poolWeight +_poolWeight;

        pool.poolWeight = _poolWeight;
        pool.minDepositAmount = _minDepositAmount;
        pool.unstakeLockedBlocks = _unstakeLockedBlocks;


    }


    // 更新质押池累计奖励
    function updataPoolReward(uint256 _pid) public  validPool(_pid) {
        

        Pool storage pool = Pools[_pid];

        if(block.number < pool.latRewardBlock){
            return;
        }
        if(pool.stTokenAmount == 0){
            pool.latRewardBlock = block.number;
            return;
        }

        uint256 multiplier = block.number - pool.latRewardBlock;
        uint256 metaNodeReward = (multiplier * metaNodePerBlock * pool.poolWeight) / totalPoolWeight;

        pool.accMetaNodePerST += (metaNodeReward * 1e12)/pool.stTokenAmount;
        pool.latRewardBlock = block.number;

    }

    // 更新所有激活的奖金池
    function massUpdataPools() public{
        for (uint256 pid = 0; pid < Pools.length; pid++) {
            if ( Pools[pid].isActive ){
                updataPoolReward(pid);
            }
            
        }
    }

    // 查询用户待领取的MetaNode奖励

    function pendingMetaNode(uint256 _pid,address _user)external view validPool(_pid) returns(uint256) {
       
        Pool storage pool = Pools[_pid];
        User storage user = users[_pid][_user];

        uint256 accMetaNodePerST = pool.accMetaNodePerST;

        if( block.number > pool.latRewardBlock && pool.stTokenAmount !=0){
            uint256 mul = block.number - pool.latRewardBlock;
            uint256 metanodeReward = (mul * metaNodePerBlock * pool.poolWeight)/totalPoolWeight;
            accMetaNodePerST += (metanodeReward * 1e12) / pool.stTokenAmount;

        }
        
        

        uint256 amount = ((user.stAmount * accMetaNodePerST) /1e12) - user.finishedMetaNode + user.pendingMetaNode;

        return amount;


    }




    // 质押代币
    function stake(uint256 _pid,uint256 _amount) external payable whenStakeNotPaused whenNotPaused validPool(_pid){

        Pool storage pool = Pools[_pid];
        User storage user = users[_pid][msg.sender];

        require(_amount >= pool.minDepositAmount, "Amount below minimum deposit");

        updataPoolReward(_pid);

        if(user.stAmount > 0){
            uint256 pending = (user.stAmount * pool.accMetaNodePerST ) - user.finishedMetaNode;

            if(pending >0){
                user.pendingMetaNode += pending;
            }
        }

        if ( pool.stTokenAddress == address(0)) {
            require( msg.value == _amount,"Invalid ETH amount");
        } else {
            require(msg.value == 0 ," Should not send ETH for ERC20 token");
            IERC20(pool.stTokenAddress).safeTransferFrom(msg.sender,address(this),_amount);
        }

        user.stAmount += _amount;
        pool.stTokenAmount += _amount;
        user.finishedMetaNode = (user.stAmount * pool.accMetaNodePerST)/1e12;

        
    }
    // 解除质押
    function unstake(uint256 _pid,uint256 _amount)external whenNotPaused whenUnStakeNotPaused validPool(_pid){
        Pool storage pool = Pools[_pid];
        User storage user = users[_pid][msg.sender];

        require(user.stAmount > _amount,"Insufficient staked amount");

        require(_amount>0,  "Amount must be greater than 0");


        updataPoolReward(_pid);

        
        uint256 pending = (user.stAmount * pool.accMetaNodePerST ) - user.finishedMetaNode;

        if(pending >0){
            user.pendingMetaNode += pending;
        }


        user.stAmount -= _amount;
        pool.stTokenAmount -= _amount;
        user.finishedMetaNode = (user.stAmount * pool.accMetaNodePerST) /1e12;

        user.requests.push(UnstakeRequest({
            unstakeLockedAmount: _amount,
            unstakeLockedBlock: block.number + pool.unstakeLockedBlocks
        }));
    }


    // 提取已解锁的质押代币
    function withdraw(uint256 _pid) external whenNotPaused validPool(_pid) {
        Pool storage pool = Pools[_pid];
        User storage user = users[_pid][msg.sender];

        uint256 totalWithdrawable = 0;
        uint256 requestCount = user.requests.length;

        for (uint256 i = 0; i < requestCount; i++) {
            if( user.requests[i].unstakeLockedBlock <= block.number ){
                totalWithdrawable += user.requests[i].unstakeLockedAmount;
            }
        }


        require(totalWithdrawable > 0, "No withdrawable amount");


        uint256 writeIndex = 0;
        for (uint256 index = 0; index < requestCount; index++) {
            if( user.requests[index].unstakeLockedBlock > block.number){
                user.requests[writeIndex] = user.requests[index];
                writeIndex++;
            }
        }

        while(user.requests.length > writeIndex){
            user.requests.pop();
        }

        if (pool.stTokenAddress == address(0)) {
            payable(msg.sender).transfer(totalWithdrawable);
        } else {
            IERC20(pool.stTokenAddress).safeTransfer(msg.sender,totalWithdrawable);
        }



    }
    // 领取MetaNode奖励
    function claim(uint256 _pid) external whenClaimNotPaused whenNotPaused validPool(_pid){
        Pool storage pool = Pools[_pid];
        User storage user = users[_pid][msg.sender];

        updataPoolReward(_pid);
        uint256 pending = ((user.stAmount * pool.accMetaNodePerST )/ 1e12) - user.finishedMetaNode;
        uint256 totalPending = pending + user.pendingMetaNode;

        require(totalPending > 0, "No pending rewards");

        user.finishedMetaNode = (user.stAmount * pool.accMetaNodePerST)/1e12;
        user.pendingMetaNode = 0;

        metaNodeToken.transfer(msg.sender,totalPending);


    }

    // 紧急提取质押代币

    function emergencyWithdraw(uint256 _pid) external whenNotPaused validPool(_pid){
        Pool storage pool = Pools[_pid];
        User storage user = users[_pid][msg.sender];

        uint256 Amount = user.stAmount;

        require(Amount > 0, "No staked amount");

        user.stAmount = 0;
        user.pendingMetaNode = 0;
        user.finishedMetaNode = 0;
        delete user.requests;

        pool.stTokenAmount -= Amount;

        if (pool.stTokenAddress == address(0)) {
            payable(msg.sender).transfer(Amount);
        } else {
            IERC20(pool.stTokenAddress).safeTransfer(msg.sender,Amount);
        }



    }


    // =========管理员函数

    // 设置每区块奖励数量
    function setMetaNodePerBlock(uint256 _amount)external onlyRole(ADMIN_ROLE) {
        massUpdataPools();
        metaNodePerBlock = _amount;
    }

    // 设置池的激活状态
    function setPoolActive(uint256 _pid,bool _isActive)external onlyRole(ADMIN_ROLE) {
        require(_pid < Pools.length,"Invalid pool ID");
        Pool storage pool = Pools[_pid];

        pool.isActive = _isActive;
        
    }


    // 设置质押操作的暂停状态
    function setStakePaused(bool _Paused) external onlyRole(OPERATOR_ROLE){
        stakePaused = _Paused;
    }

    // 设置解质押操作的暂停状态
    function setUnStakePaused(bool _Paused) external onlyRole(OPERATOR_ROLE){
        unstakePaused = _Paused;
    }
    // 设置领取奖励操作的暂停状态
    function setClaimPaused(bool _Paused) external onlyRole(OPERATOR_ROLE){
        claimePaused = _Paused;
    }


    // 暂停所有操
    function pause() external onlyRole(OPERATOR_ROLE){
         _pause();
    }
    // 恢复所有操作
    
    function unpause() external onlyRole(OPERATOR_ROLE){
         _unpause();
    }





    // 获取池的数量

    function getPoolLength()external view returns(uint256){
        uint256 _temp = Pools.length;
        return _temp;
    }
    // 获取用户在指定池的信息
    function getUserInfo(uint256 _pid,address _user) external view  returns(
        uint256 stAmount,
        uint256 pendingReward,
        UnstakeRequest[] memory requests

    ){
        User memory user = users[_pid][_user];
        stAmount=user.stAmount;
        
        pendingReward=user.pendingMetaNode;
        requests=user.requests;
        

    }
    //  获取用户可提取的数量

    function getWithdrawableAmount(uint256 _pid,address _user)external returns(uint256) {
        User memory user = users[_pid][_user];
        uint256 WithdrawableAmount = 0;

        for (uint256 index = 0; index < user.requests.length; index++) {
            if( user.requests[index].unstakeLockedBlock <= block.number ){
                WithdrawableAmount += user.requests[index].unstakeLockedAmount;

            }
        }
        return WithdrawableAmount;


    }


    // 紧急恢复意外发送到合约的代币
    function emergencyRecoverToken(address _token,uint256 _amount)external onlyRole(ADMIN_ROLE){
        require(_token != address(metaNodeToken),"Cannot recover reward token");

        for (uint256 i = 0; i < Pools.length; i++) {
            require(Pools[i].stTokenAddress != _token,"Cannot recover staked token");
        }

        if (_token == address(0)) {
            payable(msg.sender).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(msg.sender,_amount);
        }
    }



    receive() external payable {}
   
}