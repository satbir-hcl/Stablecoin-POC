// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.22 <0.9.0;
import "./hts-precompile/IHederaTokenService.sol";
import "./hts-precompile/HederaResponseCodes.sol";
import "./hts-precompile/KeyHelper.sol";
import "./hts-precompile/ExpiryHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ERC20Token.sol";
import "./TokenTypes.sol";

contract FXContract is HederaTokenService, ExpiryHelper, KeyHelper {
    IERC20 bankTokenERC20;
    IERC20 remitTokenERC20;

    address public remitTokenAddress;
    address public bankTokenAddress;
    uint8 public bankTokenType;
    uint8 public remitTokenType;

    address public bankAddress;
    string public bankName;
    uint64 public buyRate;
    uint64 public sellRate;
    address public remittanceAddress;

    event FXDepositWithdraw(address sender, address token, uint64 amount);
    event FXBuySellRateUpdate(address sender, uint64 buyRate, uint64 sellRate);

    uint64 MULTIPLIER = 1000000;

    modifier onlyBankAddress() {
        require(msg.sender == bankAddress);
        _;
    }

    modifier onlyRemittanceAddress() {
        require(msg.sender == remittanceAddress);
        _;
    }

    constructor(
        address _remittanceAddress,
        string memory _bankName,
        address _bankAddress,
        address _bankTokenAddress,
        uint8 _bankTokenType,
        uint64 _buyRate,
        uint64 _sellRate
    ) payable {
        remittanceAddress = _remittanceAddress;
        bankName = _bankName;
        bankAddress = _bankAddress;
        bankTokenAddress = _bankTokenAddress;
        bankTokenType = _bankTokenType;
        buyRate = _buyRate;
        sellRate = _sellRate;

        if (bankTokenType == TokenTypes.NATIVE_TOKEN) {
            // Associate bank token to this contract
            int responseCode = HederaTokenService.associateToken(
                address(this),
                bankTokenAddress
            );
            require(
                responseCode == HederaResponseCodes.SUCCESS,
                "Contract association to stablecoin failed"
            );
        } else {
            bankTokenERC20 = IERC20(_bankTokenAddress);
        }
    }

    function setRemitToken(
        address _remitTokenAddress,
        uint8 _remitTokenType
    ) external {
        remitTokenAddress = _remitTokenAddress;
        remitTokenType = _remitTokenType;
        int responseCode;
        if (remitTokenType == TokenTypes.NATIVE_TOKEN) {
            responseCode = HederaTokenService.associateToken(
                address(this),
                remitTokenAddress
            );
            require(
                responseCode == HederaResponseCodes.SUCCESS,
                "Contract association to remit token failed"
            );
        } else {
            remitTokenERC20 = IERC20(_remitTokenAddress);
        }
    }

    function getDetails()
        external
        view
        returns (
            string memory _bankName,
            uint64 _buyRate,
            uint64 _sellRate,
            address _tokenAddress,
            address _contractAddress,
            address _bankAddress
        )
    {
        return (
            bankName,
            buyRate,
            sellRate,
            bankTokenAddress,
            address(this),
            bankAddress
        );
    }

    function setRates(
        uint64 _buyRate,
        uint64 _sellRate
    ) external onlyBankAddress {
        sellRate = _sellRate;
        buyRate = _buyRate;
        emit FXBuySellRateUpdate(msg.sender, _buyRate, _sellRate);
    }

    function getTokenAddress() external view returns (address) {
        return bankTokenAddress;
    }

    function userDeposit(
        address userAddress,
        uint64 amount,
        uint64 firstQuote,
        address toContract
    ) external onlyRemittanceAddress {
        // used to deposit remittance or stablecoin tokens to the Bank
        // if the stablecoin Token is ERC20 use transferFrom, else use native token api
        int responseCode = 0;

        require(amount > 0, "Amount is zero");
        // can only transfer stable coin if native (if not, use standard ERC20 methods)
        if (bankTokenType == TokenTypes.NATIVE_TOKEN) {
            responseCode = HederaTokenService.transferToken(
                bankTokenAddress,
                userAddress,
                address(this),
                int64(amount)
            );
            require(
                responseCode == HederaResponseCodes.SUCCESS,
                "Failed to transfer stable coin"
            );
        } else {
            // user has to approve the amount to transfer to this contract first
            bankTokenERC20.transferFrom(
                userAddress,
                address(this),
                uint256(amount)
            );
        }

        if (remitTokenType == TokenTypes.NATIVE_TOKEN) {
            responseCode = HederaTokenService.transferToken(
                remitTokenAddress,
                address(this),
                toContract,
                int64(firstQuote)
            );
            require(
                responseCode == HederaResponseCodes.SUCCESS,
                "Failed to transfer remit token"
            );
        } else {
            remitTokenERC20.transfer(toContract, firstQuote);
        }
    }

    function userWithdraw(
        uint64 amount,
        address toAddress
    ) external onlyRemittanceAddress {
        require(amount > 0, "Amount is zero");
        // can only transfer stable coin if native (if not, use standard ERC20 methods)
        if (bankTokenType == TokenTypes.NATIVE_TOKEN) {
            _transfer(bankTokenAddress, toAddress, amount);
        } else {
            // user has to approve the amount to transfer to this contract first
            bankTokenERC20.transfer(toAddress, uint256(amount));
        }
    }

    function deposit(
        address tokenAddress,
        uint64 amount
    ) external onlyBankAddress {
        // used to deposit remittance or stablecoin tokens to the FXContract
        // if the stablecoin Token is ERC20, use standard ERC20 Transfer method to send to the FXContract

        require(amount > 0, "Amount is zero");
        // can only deposit remitToken or stableCoin
        require(
            tokenAddress == remitTokenAddress || tokenAddress == tokenAddress,
            "Only remit or bank token allowed"
        );
        // deposit remit token
        if (tokenAddress == remitTokenAddress) {
            if (remitTokenType == TokenTypes.NATIVE_TOKEN) {
                _transferFrom(
                    remitTokenAddress,
                    msg.sender,
                    address(this),
                    amount
                );
            } else {
                remitTokenERC20.transferFrom(msg.sender, address(this), amount);
            }
            // deposit bank token
        } else if (tokenAddress == bankTokenAddress) {
            if (bankTokenType == TokenTypes.NATIVE_TOKEN) {
                _transferFrom(
                    bankTokenAddress,
                    msg.sender,
                    address(this),
                    amount
                );
            } else {
                bankTokenERC20.transferFrom(msg.sender, address(this), amount);
            }
        }

        emit FXDepositWithdraw(msg.sender, tokenAddress, amount);
    }

    function withdraw(
        address tokenAddress,
        uint64 amount
    ) external onlyBankAddress {
        require(amount > 0, "Amount is zero");
        // can only withdraw remitToken or stableCoin
        require(
            tokenAddress == remitTokenAddress ||
                tokenAddress == bankTokenAddress,
            "Only remit token or bank token"
        );

        // withdraw remit token
        if (tokenAddress == remitTokenAddress) {
            if (remitTokenType == TokenTypes.NATIVE_TOKEN) {
                _transfer(tokenAddress, msg.sender, amount);
            } else {
                remitTokenERC20.transfer(msg.sender, uint256(amount));
            }
        } else {
            if (bankTokenType == TokenTypes.NATIVE_TOKEN) {
                _transfer(tokenAddress, msg.sender, amount);
            } else {
                bankTokenERC20.transfer(msg.sender, uint256(amount));
            }
        }

        emit FXDepositWithdraw(msg.sender, tokenAddress, amount);
    }

    // foreign exchange can only be invoked by factory contract
    function transfer(
        address tokenAddress,
        address to,
        uint64 amount
    ) public onlyRemittanceAddress {
        // we're going from remittance to our own token -> buying our own token
        // e.g. buying our own token from USDC
        // Native tokens support ERC20 functions
        _transfer(tokenAddress, to, amount);
    }

    function _transferFrom(
        address tokenAddress,
        address from,
        address to,
        uint64 amount
    ) private {
        if (tokenAddress == remitTokenAddress) {
            if (remitTokenType == TokenTypes.NATIVE_TOKEN) {
                int responseCode = HederaTokenService.transferToken(
                    remitTokenAddress,
                    from,
                    to,
                    int64(amount)
                );
                require(
                    responseCode == HederaResponseCodes.SUCCESS,
                    "Failed to transfer token"
                );
            } else {
                remitTokenERC20.transferFrom(from, to, amount);
            }
            // deposit bank token
        } else if (tokenAddress == bankTokenAddress) {
            if (bankTokenType == TokenTypes.NATIVE_TOKEN) {
                int responseCode = HederaTokenService.transferToken(
                    bankTokenAddress,
                    from,
                    to,
                    int64(amount)
                );
                require(
                    responseCode == HederaResponseCodes.SUCCESS,
                    "Token transfer failed"
                );
            } else {
                bankTokenERC20.transferFrom(from, to, amount);
            }
        }
    }

    function _transfer(
        address tokenAddress,
        address to,
        uint64 amount
    ) private {
        if (tokenAddress == remitTokenAddress) {
            if (remitTokenType == TokenTypes.NATIVE_TOKEN) {
                int responseCode = HederaTokenService.transferToken(
                    tokenAddress,
                    address(this),
                    to,
                    int64(amount)
                );
                require(
                    responseCode == HederaResponseCodes.SUCCESS,
                    "Failed to transfer token"
                );
            } else {
                remitTokenERC20.transfer(msg.sender, amount);
            }
            // deposit bank token
        } else if (tokenAddress == bankTokenAddress) {
            if (bankTokenType == TokenTypes.NATIVE_TOKEN) {
                int responseCode = HederaTokenService.transferToken(
                    bankTokenAddress,
                    address(this),
                    to,
                    int64(amount)
                );
                require(
                    responseCode == HederaResponseCodes.SUCCESS,
                    "Token transfer failed"
                );
            } else {
                bankTokenERC20.transfer(msg.sender, amount);
            }
        }
    }

    // foreign exchange can only be invoked by factory contract
    function buyQuote(uint64 amount) public view returns (uint64 quote) {
        require(
            msg.sender == remittanceAddress,
            "Only remittance contract allowed"
        );
        // we're going from remittance to our own token -> buying our own token
        // e.g. buying our own token from USDC
        uint64 result = (amount * buyRate) / MULTIPLIER;
        return uint64(result);
    }

    function buyQuoteOther(uint64 amount) public view returns (uint64 quote) {
        require(
            msg.sender == remittanceAddress,
            "Only remittance contract allowed"
        );
        // we're going from remittance to our own token -> buying our own token
        // e.g. buying our own token from USDC
        uint64 result = (amount * MULTIPLIER) / buyRate;
        return uint64(result);
    }

    function sellQuote(uint64 amount) public view returns (uint64 quote) {
        require(
            msg.sender == remittanceAddress,
            "Only remittance contract allowed"
        );
        // we're going from our own to remittance -> selling our own token
        // e.g. selling our own token for USDC
        uint64 result = (amount * MULTIPLIER) / sellRate;
        return uint64(result);
    }

    function sellQuoteOther(uint64 amount) public view returns (uint64 quote) {
        require(
            msg.sender == remittanceAddress,
            "Only remittance contract allowed"
        );
        // we're going from our own to remittance -> selling our own token
        // e.g. selling our own token for USDC
        uint64 result = (amount * sellRate) / MULTIPLIER;
        return uint64(result);
    }

    function getBuyRate() public view returns (uint64) {
        return buyRate;
    }

    function getSellRate() public view returns (uint64) {
        return sellRate;
    }

    function getBankAddress() public view returns (address) {
        return bankAddress;
    }
}
