// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CollaborationProposal {
    address public constant TORN = 0x77777FeDdddFfC19Ff86DB637967013e6C6A116C;
    address public constant MULTISIG = 0xb04E030140b30C27bcdfaafFFA98C57d80eDa7B4;
    uint256 public constant AMOUNT = 165_000 ether; // 165,000 TORN

    function executeProposal() external {
        require(IERC20(TORN).transfer(MULTISIG, AMOUNT), "Transfer failed");
    }
}
