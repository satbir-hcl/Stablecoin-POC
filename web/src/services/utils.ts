import axios from "axios";
import { IToken } from "./types";
import { TokenId } from "@hashgraph/sdk";
import { queryERC20Token } from "./contracts";
import { ethers } from "ethers";
import {
  Client,
  ContractExecuteTransaction,
  ContractId,
  PrivateKey,
  TransactionId,
  TransactionReceipt,
} from "@hashgraph/sdk";
import { Fragment, Interface, JsonFragment } from "@ethersproject/abi";
import { HashConnect, MessageTypes } from "hashconnect";

const delay = (ms: number | undefined) =>
  new Promise((res) => setTimeout(res, ms));

const HEX_STRINGS = "0123456789abcdef";
const MAP_HEX = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  a: 10,
  b: 11,
  c: 12,
  d: 13,
  e: 14,
  f: 15,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
};

// Fast Uint8Array to hex
export function toHex(bytes: Uint8Array) {
  return Array.from(bytes || [])
    .map((b) => HEX_STRINGS[b >> 4] + HEX_STRINGS[b & 15])
    .join("");
}

// Mimics Buffer.from(x, 'hex') logic
// Stops on first non-hex string and returns
// https://github.com/nodejs/node/blob/v14.18.1/src/string_bytes.cc#L246-L261
export function fromHex(hexString: string) {
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

export function addressesEqual(address: string, compareToAddress: string) {
  return (
    address.toLowerCase().replace("0x", "") ===
    compareToAddress.toLowerCase().replace("0x", "")
  );
}

export async function queryMirrorBalance(
  network: string,
  accountId: string,
  tokenId: string
) {
  if (!accountId) {
    console.error(
      `Mirror query for account ${accountId} and token ${tokenId} is missing values`
    );
    return;
  }
  let url = `.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens?token.id=${tokenId}&limit=1`;
  if (network === "mainnet") {
    url = `https://${network}-public`.concat(url);
  } else {
    url = `https://${network}`.concat(url);
  }
  // query mirror node
  let response = await axios({
    url: url,
    method: "get",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status === 200) {
    const tokens = response.data.tokens;
    if (tokens.length > 0) {
      return tokens[0].balance;
    } else {
      console.log("Not associated");
      throw new Error(`Not associated`);
    }
  } else {
    console.log(`Mirror response ${response.status}`);
    throw new Error(`Mirror response error`);
  }
}

export async function handleError(network: string, e: any) {
  if (e.status) {
    if ((e.status = "CONTRACT_REVERT_EXECUTED")) {
      // try get error message from mirror node
      const result = await contractErrorFromMirror(network, e.transactionId);
      return result;
    }
  }

  try {
    return e.message;
  } catch (e2) {
    return "Check console.log for error";
  }
}

export async function contractResultFromMirror(
  network: string,
  transactionId: string
): Promise<string> {
  // transaction id format 0.0.10-1234567890-000000000
  let url = `.mirrornode.hedera.com/api/v1/contracts/results/${mirrorTransactionIdFormat(
    transactionId
  )}`;
  if (network === "mainnet") {
    url = `https://${network}-public`.concat(url);
  } else {
    url = `https://${network}`.concat(url);
  }
  let retryCount = 0;

  while (retryCount < 10) {
    retryCount += 1;
    await delay(1000);

    try {
      // query mirror node
      let response = await axios({
        url: url,
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status === 200) {
        const call_result = response.data.call_result;
        return call_result;
      } else if (response.status === 400) {
        console.log(`Mirror response ${response.statusText}`);
      } else {
        console.log(
          `Mirror response ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.log("error above (404) is normal");
      // continue
    }
  }
  return "0x";
}

export async function contractErrorFromMirror(
  network: string,
  transactionId: string
): Promise<string> {
  // transaction id format 0.0.10-1234567890-000000000
  let url = `.mirrornode.hedera.com/api/v1/contracts/results/${mirrorTransactionIdFormat(
    transactionId
  )}`;
  if (network === "mainnet") {
    url = `https://${network}-public`.concat(url);
  } else {
    url = `https://${network}`.concat(url);
  }
  let retryCount = 0;

  while (retryCount < 10) {
    retryCount += 1;
    await delay(1000);

    try {
      // query mirror node
      let response = await axios({
        url: url,
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status === 200) {
        const call_result = response.data.error_message;

        if (call_result.startsWith("0x08c379a")) {
          const reason = ethers.utils.defaultAbiCoder.decode(
            ["string"],
            ethers.utils.hexDataSlice(call_result, 4)
          );
          return reason[0];
        } else {
          return call_result;
        }
      } else if (response.status === 400) {
        console.log(`Mirror response ${response.statusText}`);
      } else {
        console.log(
          `Mirror response ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.log("error above (404) is normal");
      // continue
    }
  }
  return "0x";
}

export async function queryToken(
  network: string,
  tokenAddress: string
): Promise<IToken> {
  if (!tokenAddress) {
    console.error(`Mirror query for token ${tokenAddress} is missing values`);
    throw new Error(`Mirror query for token ${tokenAddress} is missing values`);
  }
  let tokenId = tokenAddress;
  try {
    if (!tokenId.includes("0.0.")) {
      // convert solidity address to token Id
      // this may fail which is ok, it means the tokenaddress isn't resolvable to a token id
      // will query for ERC20 alternative in the catch
      tokenId = TokenId.fromSolidityAddress(tokenAddress).toString();
    }

    let url = `.mirrornode.hedera.com/api/v1/tokens/${tokenId}`;
    if (network === "mainnet") {
      url = `https://${network}-public`.concat(url);
    } else {
      url = `https://${network}`.concat(url);
    }
    // query mirror node
    let response = await axios({
      url: url,
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status === 200) {
      const tokenData = response.data;

      const token: IToken = {
        tokenId: tokenId,
        tokenAddress: TokenId.fromString(tokenId).toSolidityAddress(),
        native: true,
        name: "",
        symbol: "",
        freeze: false,
        freezeDefault: false,
        kyc: false,
        wipe: false,
        pausable: false,
      };

      if (tokenData.name) {
        token.name = tokenData.name;
        token.symbol = tokenData.symbol;
        token.freeze = tokenData.freeze_key !== null;
        token.freezeDefault = tokenData.freeze_default;
        token.kyc = tokenData.kyc_key !== null;
        token.wipe = tokenData.wipe_key !== null;
        token.pausable = tokenData.pause_key !== null;

        return token;
      } else {
        return queryERC20Token(network, tokenAddress);
      }
    } else {
      console.log(`Mirror response ${response.status}`);
    }
  } catch (error) {
    console.log(
      "error above (404) likely normal - token not a native token, trying erc20"
    );
  }
  return queryERC20Token(network, tokenAddress);
}

function mirrorTransactionIdFormat(transactionId: string) {
  // conversts 0.0.11093@1674734042.931778278 to 0.0.11093-1674734042-931778278
  // replace all dots with dashes
  let formattedId = transactionId.replaceAll(".", "-");
  // reformat the account Id
  formattedId = formattedId.replace("0-0-", "0.0.");
  // replace @ with -
  formattedId = formattedId.replace("@", "-");
  return formattedId;
}

export function dottedString(value: string) {
  if (value !== null) {
    if (value === "") {
      return "";
    } else {
      return value.substring(0, 5).concat("...").concat(value.slice(-10));
    }
  } else {
    return "undefined";
  }
}

const dummyPrivateKey = PrivateKey.generate();

export async function hashConnectExec(
  contractAddress: string,
  gas: number,
  payableAmount: number | undefined,
  functionParameters: Uint8Array,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<readonly [TransactionReceipt, TransactionId]> {
  // with client
  const client = Client.forName(network);
  try {
    // setup client with a dummy private key
    client.setOperator(defaultAccount, dummyPrivateKey);
    const transactionId = TransactionId.generate(defaultAccount);
    const transaction = new ContractExecuteTransaction()
      .setTransactionId(transactionId)
      .setGas(gas)
      .setFunctionParameters(functionParameters)
      .setMaxTransactionFee(100);

    if (contractAddress.length === 42) {
      transaction.setContractId(
        ContractId.fromEvmAddress(0, 0, contractAddress)
      );
    } else {
      transaction.setContractId(
        ContractId.fromSolidityAddress(contractAddress)
      );
    }

    if (payableAmount) {
      transaction.setPayableAmount(payableAmount);
    }
    const transactionBytes = await transaction.freezeWith(client).toBytes();

    const hashConnectTransaction: MessageTypes.Transaction = {
      byteArray: transactionBytes,
      topic: hashConnectTopic,
      metadata: {
        accountToSign: defaultAccount,
        returnTransaction: false,
      },
    };
    client.close();

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

export function encodeFunctionParameters(
  abi: string | readonly (string | Fragment | JsonFragment)[],
  functionName: string,
  parameterArray: any[]
) {
  const abiInterface = new Interface(abi);
  const functionCallAsHexString = abiInterface
    .encodeFunctionData(functionName, parameterArray)
    .slice(2);
  // convert to a Uint8Array
  return fromHex(functionCallAsHexString);
}

export async function evmAddressToHederaId(evmAddress: string) {
  if (!evmAddress) {
    console.error(`Mirror query for evmaddress ${evmAddress}`);
    return;
  }
  let url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddress}`;

  let response = await axios({
    url: url,
    method: "get",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status === 200) {
    return response.data.account;
  } else {
    console.log(`Mirror response ${response.status}`);
    throw new Error(`Mirror response error`);
  }
}

export function tokenEvmAddressToHederaId(evmAddress: string) {
  const hexToDecimal = (hex: string) => parseInt(hex, 16);
  return "0.0." + hexToDecimal(evmAddress);
}
