// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ERC20Token.sol";
import "./FXContract.sol";
import "./RemittanceContract.sol";

contract FactoryContract {
    uint64 MULTIPLIER = 1000000;
    uint32 NUM_DECIMALS = 6;

    function deployERC20Token(
        string memory name,
        string memory symbol
    ) external returns (address tokenAddress) {
        ERC20Token token = new ERC20Token(
            name,
            symbol,
            uint8(NUM_DECIMALS),
            1000000 * MULTIPLIER,
            msg.sender
        );
        tokenAddress = address(token);
    }

    function deployFXContract(
        address remittanceAddress,
        string memory bankName, // Name of the bank
        address bankAddress, // Bank Admin Address for FX contract
        address bankTokenAddress, // Bank Token Address
        uint8 bankTokenType, // 0 = native token, 1 = ERC20
        uint64 buyRate,
        uint64 sellRate
    ) external returns (address fxContractAddress) {
        FXContract fxContract = new FXContract(
            remittanceAddress,
            bankName,
            bankAddress,
            bankTokenAddress,
            bankTokenType,
            buyRate,
            sellRate
        );
        return address(fxContract);
    }

    function deployRemittanceContract(
        address remitTokenAddress,
        uint8 remitTokenType
    ) external returns (address remittanceContractAddress) {
        RemittanceContract remittanceContract = new RemittanceContract(
            remitTokenAddress,
            remitTokenType
        );
        return address(remittanceContract);
    }
}
