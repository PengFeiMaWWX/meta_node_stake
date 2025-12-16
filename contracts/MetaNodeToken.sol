// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract MetaNodeToken is ERC20,Ownable{

    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18;

    constructor() ERC20("MetaNode Token","MMT") Ownable(msg.sender){
        _mint(msg.sender,MAX_SUPPLY);
    }


    function mint(address to,uint256 amount) external onlyOwner{
        require(totalSupply() + amount < MAX_SUPPLY, "Exceeds max supply");
        _mint(to,amount);
    }
}