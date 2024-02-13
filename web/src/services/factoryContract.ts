import { HashConnect } from "hashconnect";
import { Interface } from "@ethersproject/abi";
import factoryContractJson from "../contracts/FactoryContract.json";
import { encodeFunctionParameters, hashConnectExec } from "./utils";

import { contractResultFromMirror } from "./utils";

export async function createFXContractViaFactory(
  remittanceAddress: string,
  bankName: string,
  bankAddress: string,
  bankTokenAddress: string,
  bankTokenType: number,
  buyRate: number,
  sellRate: number,
  factoryAddress: string,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<string> {
  const functionParameters = encodeFunctionParameters(
    factoryContractJson.abi,
    "deployFXContract",
    [
      remittanceAddress,
      bankName,
      bankAddress,
      bankTokenAddress,
      bankTokenType,
      buyRate,
      sellRate,
    ]
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
    "deployFXContract",
    resultData
  );
  return result[0];
}

export async function createRemittanceContractViaFactory(
  factoryAddress: string,
  remitTokenAddress: string,
  remitTokenType: number,
  hashConnect: HashConnect,
  hashConnectTopic: string,
  defaultAccount: string,
  network: string
): Promise<string> {
  const functionParameters = encodeFunctionParameters(
    factoryContractJson.abi,
    "deployRemittanceContract",
    [remitTokenAddress, remitTokenType]
  );
  console.log("Create Remittance Contract", remitTokenAddress, remitTokenType);

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
  console.log("RESULT DATA", resultData);
  const abiInterface = new Interface(factoryContractJson.abi);
  const result = abiInterface.decodeFunctionResult(
    "deployRemittanceContract",
    resultData
  );
  console.log("SUCCESS", result);
  return result[0];
}

export async function createERC20TokenViaFactory(
  factoryAddress: string,
  tokenName: string,
  tokenSymbol: string,
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
  console.log("RESULT DATA", resultData);
  const abiInterface = new Interface(factoryContractJson.abi);
  const result = abiInterface.decodeFunctionResult(
    "deployERC20Token",
    resultData
  );
  console.log("SUCCESS", result);
  return result[0];
}
