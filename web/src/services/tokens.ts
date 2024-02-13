import {
  AccountId,
  PublicKey,
  TokenCreateTransaction,
  TokenId,
  TokenSupplyType,
  TokenType,
  TransactionId,
  TransactionReceipt,
} from "@hashgraph/sdk";
import { HashConnect, MessageTypes } from "hashconnect";
import { IToken } from "./types";

const MULTIPLIER = 1000000;
const NUM_DECIMALS = 6;

export async function createNativeStableCoin(
  token: IToken,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<TokenId> {
  if (!token.native) {
    throw new Error(
      "createNativeStableCoin cannot create non-native stable coin"
    );
  }
  let url = `.mirrornode.hedera.com/api/v1/accounts/${defaultAccount}`;
  if (network === "mainnet") {
    url = `https://${network}-public`.concat(url);
  } else {
    url = `https://${network}`.concat(url);
  }

  let accountInfo: any = await window.fetch(url, { method: "GET" });
  accountInfo = await accountInfo.json();
  const key = await PublicKey.fromString(accountInfo.key.key);
  const transaction = new TokenCreateTransaction()
    .setTokenName(token.name)
    .setTokenSymbol(token.symbol)
    .setSupplyKey(key)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTokenType(TokenType.FungibleCommon)
    .setInitialSupply(100000000 * MULTIPLIER)
    .setDecimals(NUM_DECIMALS)
    .setTransactionId(TransactionId.generate(defaultAccount))
    .setNodeAccountIds([AccountId.fromString("0.0.3")])
    .setTreasuryAccountId(defaultAccount)
    .setAutoRenewAccountId(defaultAccount);
  if (token.wipe) {
    transaction.setWipeKey(key);
  }
  if (token.kyc) {
    transaction.setKycKey(key);
  }
  if (token.freeze) {
    transaction.setFreezeKey(key);
    if (token.freezeDefault) {
      transaction.setFreezeDefault(true);
    }
  }

  transaction.freeze();

  const hashConnectTransaction: MessageTypes.Transaction = {
    byteArray: transaction.toBytes(),
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
  const receipt = TransactionReceipt.fromBytes(response.receipt as Uint8Array);
  const tokenId = receipt.tokenId;
  return tokenId !== null ? tokenId : new TokenId(0, 0, 0);
}

export async function getTokenBalance(
  tokenId: string,
  accountId: string,
  network: string
): Promise<string> {
  let url = `.mirrornode.hedera.com/api/v1/accounts/${accountId}`;
  if (network === "mainnet") {
    url = `https://${network}-public`.concat(url);
  } else {
    url = `https://${network}`.concat(url);
  }

  let accountInfo: any = await window.fetch(url, { method: "GET" });
  accountInfo = await accountInfo.json();

  const tokenBalances = accountInfo.balance.tokens.find(
    (token: any) => token.token_id === tokenId
  );

  return tokenBalances.balance;
}
