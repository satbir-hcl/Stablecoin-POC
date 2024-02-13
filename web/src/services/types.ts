import { BigNumber } from "ethers";

export const tokenTypes = {
  NATIVE_TOKEN: 0,
  ERC20_TOKEN: 1,
};

export interface IFxContract {
  token: IToken;
  contractAddress: string;
  contractId: string;
  currency: string;
  bankName: string;
  buyRate: string;
  sellRate: string;
  bankAccountId: string;
  bankBalanceOwn: number;
  bankBalanceRemit: number;
  poolBalanceOwn: number;
  poolBalanceRemit: number;
}

export interface IToken {
  native: boolean;
  tokenId: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  freeze: boolean;
  freezeDefault: boolean;
  wipe: boolean;
  kyc: boolean;
  pausable: boolean;
}

export interface IRemittanceContract {
  remitTokenAddress: string;
  remitTokenType: number;
  bankCount: number;
  bankAddresses: string[];
  fxContractAddresses: string[];
  remitTokenBalance: number;
}
