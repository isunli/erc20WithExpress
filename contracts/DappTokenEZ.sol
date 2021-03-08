// SPDX-License-Identifier: MIT
pragma solidity >=0.7;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DappToken is ERC20 {
    // Constructor
    string public standard = "Dapp Token v1.0";

    constructor(uint256 _initialSupply) ERC20("DappToken", "DAPP") {
        _mint(msg.sender, _initialSupply);
    }
}
