// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.22 <0.9.0;

import "./FXContract.sol";
import "./hts-precompile/IHederaTokenService.sol";
import "./hts-precompile/HederaResponseCodes.sol";
import "./hts-precompile/KeyHelper.sol";
import "./hts-precompile/ExpiryHelper.sol";
import "./ERC20Token.sol";
import "./TokenTypes.sol";

contract RemittanceContract is HederaTokenService, ExpiryHelper, KeyHelper {
    address[] public bankAddresses;
    address[] public contractAddresses;
    address remitTokenAddress;
    uint8 remitTokenType;
    IERC20 remitTokenERC20;

    uint64 MULTIPLIER = 1000000; // We assume that all tokens have 6 decimal digits

    event RemitRemitTokenCreated(
        address remitTokenAddress,
        uint8 remitTokenType,
        int responseCode
    );
    event FxContractNew(
        address contractAddress,
        string bankName,
        address tokenAddress,
        address remitTokenAddress,
        uint64 buyRate,
        uint64 sellRate,
        address bankAddress
    );
    event RemittanceComplete(
        address fromAddress,
        address toAddress,
        uint64 amount,
        uint64 firstQuote,
        uint64 secondQuote
    );

    error DuplicateBank(string bankName);

    constructor(address _remitTokenAddress, uint8 _remitTokenType) {
        remitTokenAddress = _remitTokenAddress;
        remitTokenType = _remitTokenType;

        if (remitTokenType == TokenTypes.NATIVE_TOKEN) {
            int responseCodeInt = HederaTokenService.associateToken(
                address(this),
                remitTokenAddress
            );
            require(
                (responseCodeInt == HederaResponseCodes.SUCCESS) ||
                    (responseCodeInt ==
                        HederaResponseCodes
                            .TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT),
                "Remit token association failed"
            );
        } else {
            remitTokenERC20 = IERC20(_remitTokenAddress);
        }
        emit RemitRemitTokenCreated(
            _remitTokenAddress,
            _remitTokenType,
            HederaResponseCodes.SUCCESS
        );
    }

    function getBankCount() public view returns (uint8 count) {
        return uint8(bankAddresses.length);
    }

    function getBankAddresses(
        uint8 start,
        uint8 quantity
    ) public view returns (address[] memory) {
        uint8 end = start + quantity;

        if (end >= uint8(bankAddresses.length)) {
            end = uint8(bankAddresses.length);
        }

        address[] memory addresses = new address[](end - start);

        for (uint i = start; i < end; i++) {
            addresses[i - start] = bankAddresses[i];
        }

        return addresses;
    }

    function getContractAddresses(
        uint8 start,
        uint8 quantity
    ) public view returns (address[] memory) {
        uint8 end = start + quantity;

        if (end >= uint8(contractAddresses.length)) {
            end = uint8(contractAddresses.length);
        }

        address[] memory addresses = new address[](end - start);

        for (uint i = start; i < end; i++) {
            addresses[i - start] = contractAddresses[i];
        }

        return addresses;
    }

    // Not used currently and should not be used
    function setRemitTokenAddress(
        address _remitTokenAddress,
        uint8 _remitTokenType
    ) external {
        remitTokenAddress = _remitTokenAddress;
        remitTokenType = _remitTokenType;

        if (remitTokenType == TokenTypes.NATIVE_TOKEN) {
            int responseCodeInt = HederaTokenService.associateToken(
                address(this),
                remitTokenAddress
            );
            require(
                (responseCodeInt == HederaResponseCodes.SUCCESS) ||
                    (responseCodeInt ==
                        HederaResponseCodes
                            .TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT),
                "Remit token association failed"
            );
        } else {
            remitTokenERC20 = IERC20(_remitTokenAddress);
        }
    }

    function getRemitTokenType() public view returns (uint8) {
        return remitTokenType;
    }

    function getRemitTokenAddress()
        external
        view
        returns (address tokenAddress)
    {
        return remitTokenAddress;
    }

    function addFxContract(
        string memory _bankName,
        address _tokenAddress,
        address _fxContractAddress
    ) public {
        require(remitTokenAddress != address(0), "Remit token not created");

        // check if the bank is already registered
        for (uint i = 0; i < bankAddresses.length; i++) {
            if (bankAddresses[i] == msg.sender) {
                revert DuplicateBank({bankName: _bankName});
            }
        }

        bankAddresses.push(msg.sender);
        contractAddresses.push(address(_fxContractAddress));

        FXContract fxContract = FXContract(_fxContractAddress);
        // Set remit token to FXContract
        fxContract.setRemitToken(remitTokenAddress, remitTokenType);
        if (remitTokenType == TokenTypes.NATIVE_TOKEN) {
            int responseCodeInt = HederaTokenService.transferToken(
                remitTokenAddress,
                address(this),
                _fxContractAddress,
                1000000 * int64(MULTIPLIER)
            );
            require(
                (responseCodeInt == HederaResponseCodes.SUCCESS),
                "Transfer Remit Tokens to FXContract failed"
            );
        } else {
            remitTokenERC20.transfer(
                _fxContractAddress,
                uint256(1000000 * uint64(MULTIPLIER))
            );
        }

        uint64 _fxContractBuyRate = fxContract.getBuyRate();
        uint64 _fxContractSellRate = fxContract.getSellRate();
        address _fxContractBankAddress = fxContract.getBankAddress();

        emit FxContractNew(
            address(_fxContractAddress),
            _bankName,
            _tokenAddress,
            remitTokenAddress,
            _fxContractBuyRate,
            _fxContractSellRate,
            _fxContractBankAddress
        );
    }

    function quoteRemit(
        FXContract fromContract,
        FXContract toContract,
        uint64 amount
    ) public view returns (uint64 quote) {
        uint64 firstQuote = fromContract.sellQuote(amount);
        uint64 secondQuote = toContract.buyQuote(firstQuote);
        return secondQuote;
    }

    function quoteRemitOther(
        FXContract fromContract,
        FXContract toContract,
        uint64 amount
    ) public view returns (uint64 quote) {
        uint64 firstQuote = fromContract.sellQuoteOther(amount);
        uint64 secondQuote = toContract.buyQuoteOther(firstQuote);
        return secondQuote;
    }

    // TODO: add swap function (Alice buys Remit from eXYZ from the LP pool, or sells eXYZ for Remit)
    function abs(int64 x) private pure returns (int64) {
        return x >= 0 ? x : -x;
    }

    function remit(
        FXContract fromContract,
        FXContract toContract,
        uint64 amount,
        address toAddress,
        uint64 quote,
        int64 slippage
    ) public {
        uint64 firstQuote = fromContract.sellQuote(amount);
        uint64 secondQuote = toContract.buyQuote(firstQuote);
        // Check slippage, if second quote is more than slippage different, revert
        int64 calculatedSlippage = 100 - int64((quote * 100) / secondQuote);
        require(abs(calculatedSlippage) <= slippage, "slippage exceeded");

        // Alice transfers to bank, using approval
        // from contract also transfers remittance token to the to-contract
        fromContract.userDeposit(
            msg.sender,
            amount,
            firstQuote,
            address(toContract)
        );
        toContract.userWithdraw(secondQuote, toAddress);
        emit RemittanceComplete(
            msg.sender,
            toAddress,
            amount,
            firstQuote,
            secondQuote
        );
    }

    function getDetails()
        external
        view
        returns (address[] memory, address[] memory, address, uint8, uint8)
    {
        return (
            bankAddresses,
            contractAddresses,
            remitTokenAddress,
            remitTokenType,
            uint8(bankAddresses.length)
        );
    }
}
