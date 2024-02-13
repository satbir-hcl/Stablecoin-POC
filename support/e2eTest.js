const {
    ContractExecuteTransaction,
    ContractCreateTransaction, FileAppendTransaction, FileCreateTransaction, Client, TokenSupplyType, TokenType,
    TokenCreateTransaction, TokenAssociateTransaction, TransferTransaction, ContractId, ContractCallQuery, TokenId,
} = require("@hashgraph/sdk");
require('dotenv').config()

const remittanceContractJson = require("../web/src/contracts/RemittanceContract.json");
const fxContractJson = require("../web/src/contracts/FXContract.json");
const erc20Json = require("../web/src/contracts/ERC20.json");
const {Interface} = require("ethers/lib/utils");

let remitTokenAddress = "";
let remitTokenId = "";
let firstTokenAddress = "";
let secondTokenAddress = "";
let contractId;
let bank1FXContractAddress = "";
let bank1FXContractId;
let bank2FXContractAddress = "";
let bank2FXContractId;

const operatorClient = Client.forName(process.env.HEDERA_NETWORK);
const bank1Client = Client.forName(process.env.HEDERA_NETWORK);
const bank2Client = Client.forName(process.env.HEDERA_NETWORK);
const aliceClient = Client.forName(process.env.HEDERA_NETWORK);
const bobClient = Client.forName(process.env.HEDERA_NETWORK);

async function main() {

    const firstTokenNative = false;
    const secondTokenNative = true;

    operatorClient.setOperator(process.env.OPERATOR_ID, process.env.OPERATOR_KEY);
    bank1Client.setOperator(process.env.BANK1_ID, process.env.BANK1_KEY);
    bank2Client.setOperator(process.env.BANK2_ID, process.env.BANK2_KEY);
    aliceClient.setOperator(process.env.ALICE_ID, process.env.ALICE_KEY);
    bobClient.setOperator(process.env.BOB_ID, process.env.BOB_KEY);

    contractId = await deployRemitContract(operatorClient);
    console.log(`  contractId = ${contractId}`);

    const addresses = {};

    remitTokenAddress = await createRemitToken(contractId, operatorClient);
    remitTokenId = TokenId.fromSolidityAddress(remitTokenAddress).toString();

    addresses["RemitToken"] = remitTokenAddress;

    // create stable coin for bank 1
    let firstTokenId = TokenId.fromString("0.0.0");
    if (firstTokenNative) {
        firstTokenId = await createNativeToken(bank1Client);
        firstTokenAddress = firstTokenId.toSolidityAddress();
    } else {
        firstTokenAddress = await createERC20(contractId, bank1Client);
    }
    addresses["firstToken"] = firstTokenAddress;

    // create stable coin for bank 2
    let secondTokenId = TokenId.fromString("0.0.0");
    if (secondTokenNative) {
        secondTokenId = await createNativeToken(bank2Client);
        secondTokenAddress = secondTokenId.toSolidityAddress();
    } else {
        secondTokenAddress = await createERC20(contractId, bank2Client);
    }
    addresses["secondToken"] = secondTokenAddress;

    // associate alice and bob to the first token
    if (firstTokenNative) {
        await associateToken(firstTokenId, aliceClient);
        await associateToken(firstTokenId, bobClient);
    }

    // associate alice and bob to the second token
    if (secondTokenNative) {
        await associateToken(secondTokenId, aliceClient);
        await associateToken(secondTokenId, bobClient);
    }

    // bank 1 joins
    bank1FXContractAddress = await join(contractId, "One", firstTokenAddress, 90, 110, bank1Client);
    bank1FXContractId = ContractId.fromSolidityAddress(bank1FXContractAddress).toString();
    addresses["bank1Fx"] = bank1FXContractAddress;
    addresses["bank1FxCID"] = bank1FXContractId;

    // bank 1 transfers stable coin to its FX contract
    if (firstTokenNative) {
        await transferNativeTokens(firstTokenId, 1000, bank1FXContractId, bank1Client);
    } else {
        await transferERC20Tokens(firstTokenAddress, 1000, bank1FXContractAddress, bank1Client);
    }

    // bank 1 transfers remit token to its FX contract
    await transferNativeTokens(remitTokenId, 1000, bank1FXContractId, bank1Client);

    // bank 2 joins
    bank2FXContractAddress = await join(contractId, "two", secondTokenAddress, 80, 120, bank2Client);
    bank2FXContractId = ContractId.fromSolidityAddress(bank2FXContractAddress).toString();
    addresses["bank2Fx"]  = bank2FXContractAddress;
    addresses["bank2FxCID"] = bank1FXContractId;

    // bank 2 transfers stable coin to its FX contract
    if (secondTokenNative) {
        await transferNativeTokens(secondTokenId, 1000, bank2FXContractId, bank2Client);
    } else {
        await transferERC20Tokens(secondTokenAddress, 1000, bank2FXContractAddress, bank2Client);
    }

    // bank 1 transfers remit token to its FX contract
    await transferNativeTokens(remitTokenId, 1000, bank2FXContractId, bank2Client);

    console.table(addresses);

    // bank1 transfers 1000 to Alice
    if (firstTokenNative) {
        await transferNativeTokens(firstTokenId, 1000, aliceClient.operatorAccountId, bank1Client);
    } else {
        await transferERC20Tokens(firstTokenAddress, 1000, aliceClient.operatorAccountId.toSolidityAddress(), bank1Client);
    }

    // bank2 transfers 1000 to Bob
    if (secondTokenNative) {
        await transferNativeTokens(secondTokenId, 1000, bobClient.operatorAccountId, bank2Client);
    } else {
        await transferERC20Tokens(secondTokenAddress, 1000, bobClient.operatorAccountId.toSolidityAddress(), bank2Client);
    }

    await printBalances();

    // Alice quotes
    const aliceQuote = await quoteRemit(contractId, bank1FXContractAddress, bank2FXContractAddress, 10, aliceClient);
    console.log(`Alice quote ${aliceQuote}`);

    // Alice approves
    console.log(`Alice approves 10`);
    await approveERC20Token(firstTokenAddress, 10, bank1FXContractAddress, aliceClient);

    // Alice remits 10 to bob
    console.log(`Alice remits 10 to Bob`);
    await remit(contractId, bank1FXContractAddress, bank2FXContractAddress, 10, bobClient.operatorAccountId.toSolidityAddress(), aliceClient);

    await printBalances();

    // Bob remits 20 to Alice
    console.log(`Bob remits 20 to Alice`);
    await remit(contractId, bank2FXContractAddress, bank1FXContractAddress, 20, aliceClient.operatorAccountId.toSolidityAddress(), bobClient);

    await printBalances();

    operatorClient.close();
    bank1Client.close();
    bank2Client.close();
    aliceClient.close();
    bobClient.close();
    console.log(`Done`);
}

async function execWithReceipt(transaction, client) {
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    return receipt;
}

async function execWithRecord(transaction, client) {
    const response = await transaction.execute(client);
    const record = await response.getRecord(client);
    return record;
}


async function remit(contractId, fromContract, toContract, amount, toAddress, client) {
    const abi = remittanceContractJson.abi;
    const abiInterface = new Interface(abi);

    const functionParameters = encodeFunctionParameters(
        abi,
        'remit',
        [fromContract, toContract, amount, toAddress]
    );

    const transaction = new ContractExecuteTransaction()
        .setGas(320000)
        .setContractId(contractId)
        .setFunctionParameters(functionParameters)
        .setMaxTransactionFee(100);

    const record = await execWithRecord(transaction, client);

    const result = abiInterface.decodeFunctionResult("remit", record.contractFunctionResult.bytes);
    console.log(`Sender ${result[0]}`);
    console.log(`fromToken ${result[1]}`);
    console.log(`Amount ${result[2].toString()}`);
}

async function quoteRemit(remittanceAddress, fromContract, toContract, amount, client) {
    const abi = remittanceContractJson.abi;
    const abiInterface = new Interface(abi);

    const functionParameters = encodeFunctionParameters(
        remittanceContractJson.abi,
        'quoteRemit',
        [fromContract, toContract, amount]
    );

    const contractQuery = await new ContractCallQuery()
        .setContractId(remittanceAddress)
        .setFunctionParameters(functionParameters)
        .setGas(40_000)
        .execute(client);

    const result = abiInterface.decodeFunctionResult("quoteRemit", contractQuery.bytes);
    return result[0];
}

async function erc20Balance(tokenAddress, address, client) {
    const abi = erc20Json.abi;
    const abiInterface = new Interface(abi);

    const functionParameters = encodeFunctionParameters(
        abi,
        'balanceOf',
        [address]
    );

    const contractQuery = await new ContractCallQuery()
        .setContractId(ContractId.fromSolidityAddress(tokenAddress))
        .setFunctionParameters(functionParameters)
        .setGas(40_000)
        .execute(client);

    const result = abiInterface.decodeFunctionResult("balanceOf", contractQuery.bytes);
    return result[0].toString();
}

async function transferERC20Tokens(tokenAddress, amount, to, client) {
    const abi = erc20Json.abi;

    const functionParameters = encodeFunctionParameters(abi,'transfer',  [to, amount]);

    const transaction = new ContractExecuteTransaction()
        .setGas(400000)
        .setContractId(ContractId.fromSolidityAddress(tokenAddress))
        .setFunctionParameters(functionParameters)
        .setMaxTransactionFee(100);

    await execWithReceipt(transaction, client);
}

async function approveERC20Token(tokenAddress, amount, to, client) {
    const abi = erc20Json.abi;

    const functionParameters = encodeFunctionParameters(abi,'approve',  [to, amount]);
    const transaction = new ContractExecuteTransaction()
        .setGas(400000)
        .setContractId(ContractId.fromSolidityAddress(tokenAddress))
        .setFunctionParameters(functionParameters)
        .setMaxTransactionFee(100);

    await execWithReceipt(transaction, client);
}

async function transferNativeTokens(tokenId, amount, to, client) {
    const transaction = new TransferTransaction()
        .addTokenTransfer(tokenId, client.operatorAccountId, -amount)
        .addTokenTransfer(tokenId, to, amount);

    await execWithReceipt(transaction, client);
}

async function associateToken(nativeToken, client) {
    const transaction = new TokenAssociateTransaction()
        .setTokenIds([nativeToken])
        .setAccountId(client.operatorAccountId);

    const receipt = await execWithReceipt(transaction, client);
    return receipt.tokenId;
}

async function createNativeToken(client) {
    const transaction = new TokenCreateTransaction()
        .setTokenName('Native')
        .setTokenSymbol('nat')
        .setSupplyKey(client.publicKey)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTokenType(TokenType.FungibleCommon)
        .setInitialSupply(100000000)
        .setDecimals(2)
        .setTreasuryAccountId(client.operatorAccountId);

    const receipt = await execWithReceipt(transaction, client);
    return receipt.tokenId;
}

async function createRemitToken(contractId, client) {
    const abi = remittanceContractJson.abi;
    const abiInterface = new Interface(abi);

    const functionParameters = encodeFunctionParameters(
        remittanceContractJson.abi,
        'createRemitToken',
        []
    );

    const transaction = new ContractExecuteTransaction()
        .setGas(195000)
        .setPayableAmount(50)
        .setContractId(contractId)
        .setFunctionParameters(functionParameters)
        .setMaxTransactionFee(100);

    const record = await execWithRecord(transaction, client);
    const result = abiInterface.decodeFunctionResult("createRemitToken", record.contractFunctionResult.bytes);
    const resultCode = result[1];
    return result[0];
}

async function join(contractId, name, tokenAddress, buy, sell, client) {
    const abi = remittanceContractJson.abi;
    const abiInterface = new Interface(abi);

    const functionParameters = encodeFunctionParameters(
        remittanceContractJson.abi,
        'addFxContract',
        [
            name,
            tokenAddress,
            buy,
            sell
        ]
    );

    const transaction = new ContractExecuteTransaction()
        .setGas(2700000)
        .setPayableAmount(100)
        .setContractId(contractId)
        .setFunctionParameters(functionParameters)
        .setMaxTransactionFee(100);

    const record = await execWithRecord(transaction, client);
    const result = abiInterface.decodeFunctionResult("createERC20Token", record.contractFunctionResult.bytes);
    return result[0];
}

async function createERC20(contractId, client) {
    const abi = remittanceContractJson.abi;
    const abiInterface = new Interface(abi);

    const functionParameters = encodeFunctionParameters(
        abi,
        'createERC20Token',
        [
            'ERC20',
            'ERC',
        ]
    );

    const transaction = new ContractExecuteTransaction()
        .setGas(221000)
        .setContractId(contractId)
        .setFunctionParameters(functionParameters)
        .setMaxTransactionFee(100);

    const record = await execWithRecord(transaction, client);
    const result = abiInterface.decodeFunctionResult("createERC20Token", record.contractFunctionResult.bytes);
    return result[0];
}

function encodeFunctionParameters(abi, functionName, parameterArray) {
    const abiInterface = new Interface(abi);
    const functionCallAsHexString = abiInterface.encodeFunctionData(functionName, parameterArray).slice(2);
    // convert to a Uint8Array
    return fromHex(functionCallAsHexString);
}

async function deployRemitContract(client) {
    // deploy the smart contract as operator
    // upload the file
    console.log("Creating file");
    let transaction = new FileCreateTransaction()
        .setKeys([client.operatorPublicKey])
        .setContents("");

    let receipt = await execWithReceipt(transaction, client);
    const fileId = receipt.fileId;

    console.log(`  appending to file`);
    // append to file
    transaction = await new FileAppendTransaction()
        .setFileId(fileId)
        .setContents(remittanceContractJson.bytecode);
    await execWithReceipt(transaction, client);

    console.log(`  fileId ${fileId.toString()}`);

    // deploy the contract
    console.log(`Deploying contract`);
    transaction = new ContractCreateTransaction()
        .setBytecodeFileId(fileId)
        .setGas(1_000_000);

    receipt = await execWithReceipt(transaction, client);
    return receipt.contractId;
}

async function printBalances() {
    let balances = {};
    let balance = await getBalances(bank1Client.operatorAccountId.toSolidityAddress(), operatorClient);
    balances["bank1"] = balance;

    balance = await getBalances(bank1FXContractAddress, operatorClient);
    balances["fx1"] = balance;

    balance = await getBalances(bank2Client.operatorAccountId.toSolidityAddress(), operatorClient);
    balances["bank2"] = balance;

    balance = await getBalances(bank2FXContractAddress, operatorClient);
    balances["fx2"] = balance;

    balance = await getBalances(aliceClient.operatorAccountId.toSolidityAddress(), operatorClient);
    balances["alice"] = balance;

    balance = await getBalances(bobClient.operatorAccountId.toSolidityAddress(), operatorClient);
    balances["bob"] = balance;

    console.log(`------ BALANCES ---------`);
    console.table(balances);
}

async function getBalances(balanceOf, client) {
    const balances = {};
    balances["address"] = balanceOf;
    let balance = await erc20Balance(remitTokenAddress, balanceOf, client);
    balances["remit"] = balance;
    balance = await erc20Balance(firstTokenAddress, balanceOf, client);
    balances["first"] = balance;
    balance = await erc20Balance(secondTokenAddress, balanceOf, client);
    balances["second"] = balance;
    return balances;
}

function fromHex(hexString) {
    const bytes = new Uint8Array(Math.floor((hexString || "").length / 2));
    let i;
    for (i = 0; i < bytes.length; i++) {
        // @ts-ignore
        const a = MAP_HEX[hexString[i * 2]];
        // @ts-ignore
        const b = MAP_HEX[hexString[i * 2 + 1]];
        if (a === undefined || b === undefined) {
            break;
        }
        bytes[i] = (a << 4) | b;
    }
    return i === bytes.length ? bytes : bytes.slice(0, i);
}

const HEX_STRINGS = "0123456789abcdef";
const MAP_HEX = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
    7: 7, 8: 8, 9: 9, a: 10, b: 11, c: 12, d: 13,
    e: 14, f: 15, A: 10, B: 11, C: 12, D: 13,
    E: 14, F: 15
};


void main();
