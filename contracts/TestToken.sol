// SPDX-License-Identifier: MIT


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract TestToken is ERC20{

    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symol,
        uint8 decimals_,
        uint256 totalsupply_
    ) ERC20(name,symol){
        _decimals = decimals_;
        _mint(msg.sender,totalsupply_*10**decimals_);
    }

    function decimals() public view virtual override returns(uint8){
        return  _decimals;  
    }

    function mint(address to,uint256 amount) external {
        _mint(to,amount);
    }






}