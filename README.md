# MetaNode 质押系统

一个功能完善的区块链质押系统，支持多种代币质押并获得 MetaNode 代币奖励。系统提供多个独立的质押池，每个池可以独立配置质押代币、奖励计算和锁定期等参数。

## 合约架构

```
stake/
├── contracts/
│   ├── StakePool.sol          # Main staking contract
│   ├── StakePoolV2.sol        # Upgraded version
│   ├── MetaNodeToken.sol      # Reward token
│   └── TestToken.sol          # Test ERC20 token
├── test/
│   └── Security.test.js      # Main tests
│          
├── scripts/
│   ├── deploy.js              # Deployment script
│   ├── upgrade.js             # Upgrade script
│   └── interact.js            # Interaction script
├── deployments/               # Deployment artifacts
├── hardhat.config.js          # Hardhat configuration
├── package.json
└── README.md
```

### 核心合约

1. **StakePool.sol**: 主质押合约，包含所有核心功能
2. **MetaNodeToken.sol**: ERC20 奖励代币合约
3. **TestToken.sol**: 用于测试的示例 ERC20 代币
4. **StakePoolV2.sol**: 带有奖励倍数功能的升级版本

## 核心功能

### 用户功能

#### 质押

```solidity
// 质押 ETH（池 0）
function stake(uint256 _pid, uint256 _amount) payable

// 质押 ERC20 代币（需要先授权）
testToken.approve(stakePoolAddress, amount)
stakePool.stake(_pid, _amount)
```

#### 解质押

```solidity
function unstake(uint256 _pid, uint256 _amount)  // 发起解质押请求
function withdraw(uint256 _pid)  // 锁定期后提取
```

#### 奖励

```solidity
function claim(uint256 _pid)  // 领取奖励
function pendingMetaNode(uint256 _pid, address _user) view returns (uint256)  // 查询待领取奖励
```

#### 紧急提现

```solidity
function emergencyWithdraw(uint256 _pid)  // 放弃奖励，立即提取质押代币
```

### 管理员功能

#### 池管理

```solidity
function addPool(address _stTokenAddress, uint256 _poolWeight, uint256 _minDepositAmount, uint256 _unstakeLockedBlocks)  // 添加新池
function updatePool(uint256 _pid, uint256 _poolWeight, uint256 _minDepositAmount, uint256 _unstakeLockedBlocks)  // 更新池参数
function setPoolActive(uint256 _pid, bool _isActive)  // 设置池激活状态
```

#### 系统控制

```solidity
function setMetaNodePerBlock(uint256 _metaNodePerBlock)  // 设置每区块奖励
function pause() / unpause()  // 全局暂停/恢复
function setStakePaused(bool _paused)  // 暂停/恢复质押
function setUnstakePaused(bool _paused)  // 暂停/恢复解质押
function setClaimPaused(bool _paused)  // 暂停/恢复领取奖励
```

## 快速开始

### 1. 安装依赖

```bash
cd stake
npm install
```

### 2. 环境配置

```bash
cp .env.example .env
# 编辑 .env 文件配置你的参数
```

必需的环境变量：

- `SEPOLIA_RPC_URL`: Sepolia 测试网 RPC URL
- `PRIVATE_KEY`: 你的钱包私钥（不需要 0x 前缀）
- `ETHERSCAN_API_KEY`: 用于合约验证的 API Key

### 3. 编译合约

```bash
npx hardhat compile
```

### 4. 运行测试

```bash
# 运行所有测试
npx hardhat test

```

### 5. 部署到 Sepolia 测试网

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

部署过程将会：

- 部署 MetaNodeToken（奖励代币）
- 部署 TestToken（用于测试 ERC20 质押）
- 部署可升级的 StakePool 代理合约
- 设置初始代币分配
- 创建两个初始池（ETH 池和 TestToken 池）
- 保存部署信息到 `deployments/` 文件夹

### 6. 升级合约
```bash
npx hardhat run scripts/upgrade.js --network sepolia
```
### 7. 与已部署合约交互

```bash
# 首先在 .env 中设置合约地址
npm run interact:sepolia
```

## 许可证



MIT License
