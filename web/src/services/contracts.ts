import FxContract from "../jsContracts/FxContract";
import {
  Client,
  PrivateKey,
  TokenAssociateTransaction,
  TransactionId,
  TransactionReceipt,
  TransferTransaction,
  AccountAllowanceApproveTransaction,
} from "@hashgraph/sdk";
import { HashConnect, MessageTypes } from "hashconnect";
import { IToken } from "./types";
import { Interface } from "@ethersproject/abi";
import fxContractJson from "../contracts/FXContract.json";
import factoryContractJson from "../contracts/FactoryContract.json";
import { encodeFunctionParameters, hashConnectExec } from "./utils";
import erc20Json from "../contracts/ERC20Token.json";

import { contractResultFromMirror } from "./utils";
import { ethers, Contract } from "ethers";

const dummyPrivateKey = PrivateKey.generate();

export function fxContractByCurrency(
  fxContracts: FxContract[],
  currency: string
): FxContract {
  const found = fxContracts.find((fxContract) => {
    return fxContract.currency === currency;
  });
  if (found) {
    return found;
  } else {
    throw new Error(`Invalid Currency Name ${currency}`);
  }
}

export async function transferTokens(
  tokenId: string,
  amount: number,
  destination: string,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt, TransactionId]> {
  const transactionId = TransactionId.generate(defaultAccount);
  const client = Client.forName(network);
  try {
    client.setOperator(defaultAccount, dummyPrivateKey);
    const hashConnectTransaction: MessageTypes.Transaction = {
      byteArray: new TransferTransaction()
        .setTransactionId(transactionId)
        .addTokenTransfer(tokenId, defaultAccount, -amount)
        .addTokenTransfer(tokenId, destination, amount)
        .freezeWith(client)
        .toBytes(),
      topic: hashConnectTopic,
      metadata: {
        accountToSign: defaultAccount,
        returnTransaction: false,
      },
    };

    const response = await hashConnect.sendTransaction(
      hashConnectTopic,
      hashConnectTransaction
    );
    if (!response.success) {
      throw response.error;
    }
    const receipt = TransactionReceipt.fromBytes(
      response.receipt as Uint8Array
    );
    return [receipt, transactionId];
  } catch (e) {
    client.close();
    throw e;
  }
}

export async function associateToken(
  tokenId: string,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt]> {
  const client = Client.forName(network);
  try {
    client.setOperator(defaultAccount, dummyPrivateKey);
    const hashConnectTransaction: MessageTypes.Transaction = {
      byteArray: new TokenAssociateTransaction()
        .setTransactionId(TransactionId.generate(defaultAccount))
        .setTokenIds([tokenId])
        .setAccountId(defaultAccount)
        .freezeWith(client)
        .toBytes(),
      topic: hashConnectTopic,
      metadata: {
        accountToSign: defaultAccount,
        returnTransaction: false,
      },
    };

    const response = await hashConnect.sendTransaction(
      hashConnectTopic,
      hashConnectTransaction
    );
    if (!response.success) {
      throw new Error(response.error);
    }
    return [
      TransactionReceipt.fromBytes(response.receipt as Uint8Array),
    ] as const;
  } catch (e) {
    client.close();
    throw e;
  }
}

export async function approve(
  tokenId: string,
  spender: string,
  amount: number,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt]> {
  const client = Client.forName(network);
  try {
    client.setOperator(defaultAccount, dummyPrivateKey);
    const hashConnectTransaction: MessageTypes.Transaction = {
      byteArray: new AccountAllowanceApproveTransaction()
        .approveTokenAllowance(tokenId, defaultAccount, spender, amount)
        .freezeWith(client)
        .toBytes(),
      topic: hashConnectTopic,
      metadata: {
        accountToSign: defaultAccount,
        returnTransaction: false,
      },
    };

    const response = await hashConnect.sendTransaction(
      hashConnectTopic,
      hashConnectTransaction
    );
    if (!response.success) {
      throw new Error(response.error);
    }
    return [
      TransactionReceipt.fromBytes(response.receipt as Uint8Array),
    ] as const;
  } catch (e) {
    client.close();
    throw e;
  }
}

export async function approveERC20Token(
  remittanceAddress: string,
  toAddress: string,
  amount: number,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt, TransactionId]> {
  const functionParameters = encodeFunctionParameters(
    erc20Json.abi,
    "approve",
    [toAddress, amount]
  );

  return hashConnectExec(
    remittanceAddress,
    50000,
    undefined,
    functionParameters,
    hashConnect,
    hashConnectTopic,
    defaultAccount,
    network
  );
}

export async function queryERC20Balance(
  network: string,
  address: string,
  tokenAddress: string
): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );
  let erc20Contract = new Contract(tokenAddress, erc20Json.abi, provider);
  const balance = await erc20Contract.balanceOf(address);

  return balance.toString();
}

export async function queryERC20Token(
  network: string,
  tokenAddress: string
): Promise<IToken> {
  console.log(`getting contract details from ERC20 ${tokenAddress}`);
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );
  let erc20Contract = new Contract(tokenAddress, erc20Json.abi, provider);
  const symbol = await erc20Contract.symbol();
  console.log(`got symbol ${symbol}`);
  const name = await erc20Contract.name();
  console.log(`got name ${name}`);

  const token: IToken = {
    tokenId: "",
    tokenAddress: tokenAddress,
    native: false,
    name: name,
    symbol: symbol,
    freeze: false,
    freezeDefault: false,
    kyc: false,
    wipe: false,
    pausable: false,
  };
  return token;
}

export async function createERC20(
  tokenName: string,
  tokenSymbol: string,
  factoryAddress: string,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<string> {
  const functionParameters = encodeFunctionParameters(
    factoryContractJson.abi,
    "deployERC20Token",
    [tokenName, tokenSymbol]
  );

  const [, transactionId] = await hashConnectExec(
    factoryAddress,
    10000000,
    undefined,
    functionParameters,
    hashConnect,
    hashConnectTopic,
    defaultAccount,
    network
  );
  console.log(transactionId.toString());
  // get response from mirror and decode result
  const resultData = await contractResultFromMirror(
    network,
    transactionId.toString()
  );
  const abiInterface = new Interface(factoryContractJson.abi);
  const result = abiInterface.decodeFunctionResult(
    "deployERC20Token",
    resultData
  );
  return result[0];
}

export async function depositERC20(
  erc20Address: string,
  to: string,
  amount: number,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt, TransactionId]> {
  console.log("Deposit ERC20", erc20Address, to, amount);
  const functionParameters = encodeFunctionParameters(
    erc20Json.abi,
    "transfer",
    [to, amount]
  );
  return hashConnectExec(
    erc20Address,
    100000,
    undefined,
    functionParameters,
    hashConnect,
    hashConnectTopic,
    defaultAccount,
    network
  );
}

export async function deposit(
  contractAddress: string,
  tokenAddress: string,
  amount: number,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt, TransactionId]> {
  const functionParameters = encodeFunctionParameters(
    fxContractJson.abi,
    "deposit",
    [tokenAddress, amount]
  );
  return hashConnectExec(
    contractAddress,
    55000,
    undefined,
    functionParameters,
    hashConnect,
    hashConnectTopic,
    defaultAccount,
    network
  );
}

export async function withdraw(
  contractAddress: string,
  tokenAddress: string,
  amount: number,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt, TransactionId]> {
  const functionParameters = encodeFunctionParameters(
    fxContractJson.abi,
    "withdraw",
    [tokenAddress, amount]
  );
  console.log("Withdraw", contractAddress, tokenAddress, amount);
  return hashConnectExec(
    contractAddress,
    100000,
    undefined,
    functionParameters,
    hashConnect,
    hashConnectTopic,
    defaultAccount,
    network
  );
}

export async function updateRates(
  contractAddress: string,
  buyRate: string,
  sellRate: string,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt, TransactionId]> {
  const functionParameters = encodeFunctionParameters(
    fxContractJson.abi,
    "setRates",
    [buyRate, sellRate]
  );
  return hashConnectExec(
    contractAddress,
    32000,
    undefined,
    functionParameters,
    hashConnect,
    hashConnectTopic,
    defaultAccount,
    network
  );
}
