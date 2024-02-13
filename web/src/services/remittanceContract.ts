import FxContract from "../jsContracts/FxContract";
import {
  Client,
  AccountId,
  PrivateKey,
  TokenAssociateTransaction,
  TransactionId,
  TransactionReceipt,
  TransferTransaction,
} from "@hashgraph/sdk";
import { HashConnect, MessageTypes } from "hashconnect";
import { tokenTypes } from "./types";
import remittanceContractJson from "../contracts/RemittanceContract.json";
import erc20TokenJson from "../contracts/ERC20Token.json";
import {
  encodeFunctionParameters,
  hashConnectExec,
  evmAddressToHederaId,
  tokenEvmAddressToHederaId,
} from "./utils";
import { ethers, Contract } from "ethers";

const dummyPrivateKey = PrivateKey.generate();

export async function quoteRemitContract(
  remittanceAddress: string,
  fromContract: string,
  toContract: string,
  amount: number
): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );
  let contract = new Contract(
    remittanceAddress,
    remittanceContractJson.abi,
    provider
  );
  const quote = await contract.quoteRemit(fromContract, toContract, amount);
  return quote.toString();
}

export async function quoteRemitContractOther(
  remittanceAddress: string,
  fromContract: string,
  toContract: string,
  amount: number
): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );
  let contract = new Contract(
    remittanceAddress,
    remittanceContractJson.abi,
    provider
  );
  const quote = await contract.quoteRemitOther(
    fromContract,
    toContract,
    amount
  );
  return quote.toString();
}

export async function remitContractCall(
  remittanceAddress: string,
  fromContract: string,
  toContract: string,
  amount: number,
  toAddress: string,
  quote: string,
  slippage: number,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt, TransactionId]> {
  //remit(FXContract fromContract, FXContract toContract, int64 amount, address toAddress) public {
  console.log(amount, quote, slippage);
  const functionParameters = encodeFunctionParameters(
    remittanceContractJson.abi,
    "remit",
    [
      fromContract,
      toContract,
      amount,
      AccountId.fromString(toAddress).toSolidityAddress(),
      quote,
      slippage,
    ]
  );

  return hashConnectExec(
    remittanceAddress,
    115000,
    undefined,
    functionParameters,
    hashConnect,
    hashConnectTopic,
    defaultAccount,
    network
  );
}

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

export async function transferRemitToken(
  remitTokenAddress: string,
  remitTokenType: number,
  toAddress: string,
  amount: number,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt, TransactionId]> {
  if (remitTokenType === tokenTypes.ERC20_TOKEN) {
    const functionParameters = encodeFunctionParameters(
      erc20TokenJson.abi,
      "transfer",
      [toAddress, amount]
    );
    return hashConnectExec(
      remitTokenAddress,
      1000000,
      undefined,
      functionParameters,
      hashConnect,
      hashConnectTopic,
      defaultAccount,
      network
    );
  } else if (remitTokenType === tokenTypes.NATIVE_TOKEN) {
    const transactionId = TransactionId.generate(defaultAccount);
    const client = Client.forName(network);
    const tokenId = tokenEvmAddressToHederaId(remitTokenAddress);
    const toId = await evmAddressToHederaId(toAddress);
    try {
      client.setOperator(defaultAccount, dummyPrivateKey);
      const hashConnectTransaction: MessageTypes.Transaction = {
        byteArray: new TransferTransaction()
          .setTransactionId(transactionId)
          .addTokenTransfer(tokenId.toString(), defaultAccount, -amount)
          .addTokenTransfer(tokenId.toString(), toId.toString(), amount)
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
  throw new Error("Unable to transfer remit token");
}

export async function setRemitTokenAddress(
  remittanceContractAddress: string,
  remitTokenAddress: string,
  remitTokenType: number,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt, TransactionId]> {
  const functionParameters = encodeFunctionParameters(
    remittanceContractJson.abi,
    "setRemitTokenAddress",
    [remitTokenAddress, remitTokenType]
  );
  return hashConnectExec(
    remittanceContractAddress,
    1000000,
    undefined,
    functionParameters,
    hashConnect,
    hashConnectTopic,
    defaultAccount,
    network
  );
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

export async function joinRemittance(
  bankName: string,
  bankTokenAddress: string,
  fxContractAddress: string,
  remittanceAddress: string,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt, TransactionId]> {
  // function addFxContract(string memory _bankName, address _tokenAddress, uint8 _buyRate, uint8 _sellRate) public payable {
  console.log("AddFXContract", bankName, bankTokenAddress, fxContractAddress);
  const functionParameters = encodeFunctionParameters(
    remittanceContractJson.abi,
    "addFxContract",
    [bankName, bankTokenAddress, fxContractAddress]
  );

  return hashConnectExec(
    remittanceAddress,
    10000000,
    undefined,
    functionParameters,
    hashConnect,
    hashConnectTopic,
    defaultAccount,
    network
  );
}

export async function getERC20RemitTokenBalance(
  remitTokenAddress: string,
  accountAddress: string
): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );
  console.log(remitTokenAddress, accountAddress);
  let contract = new Contract(remitTokenAddress, erc20TokenJson.abi, provider);
  const balance = await contract.balanceOf(accountAddress);
  return balance.toString();
}

export async function getRemitTokenType(
  remittanceAddress: string
): Promise<number> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );
  let contract = new Contract(
    remittanceAddress,
    remittanceContractJson.abi,
    provider
  );
  return await contract.getRemitTokenType();
}

export async function getBankCount(remittanceAddress: string): Promise<number> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );
  let contract = new Contract(
    remittanceAddress,
    remittanceContractJson.abi,
    provider
  );
  return await contract.getBankCount();
}

export async function getBankAddresses(
  remittanceAddress: string,
  start: number,
  end: number
): Promise<Array<string>> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );
  let contract = new Contract(
    remittanceAddress,
    remittanceContractJson.abi,
    provider
  );
  return await contract.getBankAddresses(start, end);
}

export async function getContractAddresses(
  remittanceAddress: string,
  start: number,
  end: number
): Promise<Array<string>> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );
  let contract = new Contract(
    remittanceAddress,
    remittanceContractJson.abi,
    provider
  );
  return await contract.getContractAddresses(start, end);
}

export async function getRemitTokenAddress(
  remittanceAddress: string
): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );
  let contract = new Contract(
    remittanceAddress,
    remittanceContractJson.abi,
    provider
  );
  return await contract.getRemitTokenAddress();
}

export async function getDetails(remittanceAddress: string): Promise<any[]> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );
  let contract = new Contract(
    remittanceAddress,
    remittanceContractJson.abi,
    provider
  );
  return await contract.getDetails();
}
