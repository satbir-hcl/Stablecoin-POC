import React, { useEffect, useState } from "react";
import { BigNumber, Contract } from "ethers";
import remittanceContractJson from "../../contracts/RemittanceContract.json";
import fxContractJson from "../../contracts/FXContract.json";
import erc20ContractJson from "../../contracts/ERC20Token.json";

import { ethers } from "ethers/lib.esm";
import { useToast } from "@chakra-ui/react";
import { IFxContract } from "../../services/types";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectState,
  setRemitTokenAddress,
  setRemitTokenType,
  updateFxContracts,
  selectRemitTokenAddress,
} from "../../services/globalStateSlice";
import { AccountId, ContractId } from "@hashgraph/sdk";
import { addressesEqual, queryToken } from "../../services/utils";
import { queryERC20Balance } from "../../services/contracts";

interface BaseContainerProps {}

const MULTIPLIER = 1000000;

function Fetcher({}: BaseContainerProps) {
  const globalState = useAppSelector(selectState);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState(new Map());
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_JSON_RPC_RELAY_URL
  );

  function addSubscription(contract: string, event: string) {
    const exists = subscriptions.has(contract.concat(event));
    if (!exists) {
      setSubscriptions(
        new Map(subscriptions.set(contract.concat(event), true))
      );
    }
    return exists;
  }

  function clearSubscriptions() {
    setSubscriptions(new Map());
  }

  function subscribeToERC20Transfer(fxContract: IFxContract) {
    //emit Transfer(from, to, amount);
    let eventName = "Transfer";
    if (!addSubscription(fxContract.token.tokenAddress, eventName)) {
      const contract = new Contract(
        fxContract.token.tokenAddress,
        erc20ContractJson.abi,
        provider
      );
      contract.on(
        eventName,
        async (from: string, to: string, amount: number) => {
          // get the balance of the sender

          const updatedFxContract = { ...fxContract };

          let balance = await queryERC20Balance(
            globalState.network,
            from,
            fxContract.token.tokenAddress
          );
          if (addressesEqual(from, fxContract.contractAddress)) {
            updatedFxContract.poolBalanceOwn = Number(balance);
          } else if (
            addressesEqual(
              from,
              AccountId.fromString(fxContract.bankAccountId).toSolidityAddress()
            )
          ) {
            updatedFxContract.bankBalanceOwn = Number(balance);
          }

          balance = await queryERC20Balance(
            globalState.network,
            to,
            fxContract.token.tokenAddress
          );
          if (addressesEqual(to, fxContract.contractAddress)) {
            updatedFxContract.poolBalanceOwn = Number(balance);
          } else if (
            addressesEqual(
              to,
              AccountId.fromString(fxContract.bankAccountId).toSolidityAddress()
            )
          ) {
            console.log(to);
            console.log(
              AccountId.fromString(fxContract.bankAccountId).toSolidityAddress()
            );
            updatedFxContract.bankBalanceOwn = Number(balance);
          }

          dispatch(updateFxContracts(updatedFxContract));
          toast({
            description: `Deposit/Withdraw complete`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      );
    }
  }

  function subscribeToBuySellRateUpdate(fxContract: IFxContract) {
    // event FXBuySellRateUpdate(address sender, uint8 buyRate, uint8 sellRate);
    let eventName = "FXBuySellRateUpdate";
    if (!addSubscription(fxContract.contractAddress, eventName)) {
      const contract = new Contract(
        fxContract.contractAddress,
        fxContractJson.abi,
        provider
      );
      contract.on(
        eventName,
        (sender: string, buyRate: number, sellRate: number) => {
          // find the contract from the sender
          const updatedFxContract = { ...fxContract };
          if (buyRate !== 0) {
            updatedFxContract.buyRate = buyRate.toString();
          }
          if (sellRate !== 0) {
            updatedFxContract.sellRate = sellRate.toString();
          }
          dispatch(updateFxContracts(updatedFxContract));
          toast({
            description: "Buy/Sell rate updated",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      );
    }
  }

  function subscribeToRemitTokenCreated() {
    // event RemitRemitTokenCreated(address remitTokenAddress, int responseCode);
    let eventName = "RemitRemitTokenCreated";
    if (!addSubscription(globalState.remittanceContractAddress, eventName)) {
      const contract = new Contract(
        globalState.remittanceContractAddress,
        remittanceContractJson.abi,
        provider
      );
      contract.on(
        eventName,
        (
          remitTokenAddress: string,
          remitTokenType: number,
          responseCode: bigint
        ) => {
          if (responseCode.valueOf().toString(10) === "22") {
            dispatch(setRemitTokenAddress(remitTokenAddress));
            dispatch(setRemitTokenType(remitTokenType));
            toast({
              description: "Remit Token Created",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          } else {
            dispatch(setRemitTokenAddress(""));
            toast({
              description: "Remit Token Creation Failed",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          }
        }
      );
    }
  }

  function subscribeToFxContractNew() {
    // event FxContractNew (address bankAddress, address tokenAddress, address remitTokenAddress, uint256 buyRate, uint256 sellRate);
    const eventName = "FxContractNew";
    // remove just in case
    if (!addSubscription(globalState.remittanceContractAddress, eventName)) {
      const contract = new Contract(
        globalState.remittanceContractAddress,
        remittanceContractJson.abi,
        provider
      );
      contract.on(
        eventName,
        async (
          contractAddress: string,
          bankName: string,
          tokenAddress: string,
          remitTokenAddress: string,
          buyRate: string,
          sellRate: string,
          bankAddress: string
        ) => {
          //tokenAddress
          // get token details
          const token = await queryToken(globalState.network, tokenAddress);

          // add contract
          const fxContract: IFxContract = {
            token: token,
            bankName: bankName,
            buyRate: Number(buyRate).toString(),
            contractAddress: contractAddress,
            contractId: ContractId.fromEvmAddress(
              0,
              0,
              contractAddress
            ).toString(),
            currency: token.symbol,
            sellRate: Number(sellRate).toString(),
            bankAccountId: AccountId.fromEvmAddress(
              0,
              0,
              bankAddress
            ).toString(),
            bankBalanceOwn: 0,
            bankBalanceRemit: 0,
            poolBalanceOwn: 0,
            poolBalanceRemit: 0,
          };

          const bankAccountAddress = AccountId.fromString(
            fxContract.bankAccountId
          ).toSolidityAddress();

          let balance = await queryERC20Balance(
            globalState.network,
            bankAccountAddress,
            remitTokenAddress
          );
          fxContract.bankBalanceRemit = Number(balance);

          balance = await queryERC20Balance(
            globalState.network,
            contractAddress,
            fxContract.token.tokenAddress
          );
          fxContract.poolBalanceOwn = Number(balance);

          balance = await queryERC20Balance(
            globalState.network,
            contractAddress,
            remitTokenAddress
          );
          fxContract.poolBalanceRemit = Number(balance);

          balance = await queryERC20Balance(
            globalState.network,
            bankAccountAddress,
            fxContract.token.tokenAddress
          );
          fxContract.bankBalanceOwn = Number(balance);

          dispatch(updateFxContracts(fxContract));
          subscribeToDepositWithdraw(fxContract);
          if (!fxContract.token.tokenId) {
            // not a native token, subscribe to ERC20 Transfer events
            subscribeToERC20Transfer(fxContract);
          }
          subscribeToBuySellRateUpdate(fxContract);

          toast({
            description: `${bankName} joined`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      );
    }
  }

  function subscribeToDepositWithdraw(fxContract: IFxContract) {
    // event FXDepositWithdraw(address sender, address token);
    const eventName = "FXDepositWithdraw";
    if (!addSubscription(fxContract.contractAddress, eventName)) {
      console.log(
        "subscribe FXContract",
        fxContract.bankName,
        fxContract.contractAddress
      );
      const contract = new Contract(
        fxContract.contractAddress,
        fxContractJson.abi,
        provider
      );
      contract.on(
        eventName,
        async (sender: string, token: string, amount: number) => {
          console.log("FXDepositWithdraw");
          try {
            if (fxContract.bankAccountId.length > 0) {
              const updatedFxContract = { ...fxContract };
              // balance = await queryERC20Balance(globalState.network, bankAccountId, bankTokenId);
              // native tokens can be queried like an ERC20 contract
              const newBalanceBank = await queryERC20Balance(
                globalState.network,
                sender,
                token
              );
              const newBalanceContract = await queryERC20Balance(
                globalState.network,
                fxContract.contractAddress,
                token
              );

              if (addressesEqual(token, fxContract.token.tokenAddress)) {
                updatedFxContract.bankBalanceOwn = Number(newBalanceBank);
                updatedFxContract.poolBalanceOwn = Number(newBalanceContract);
              } else {
                updatedFxContract.bankBalanceRemit = Number(newBalanceBank);
                updatedFxContract.poolBalanceRemit = Number(newBalanceContract);
              }

              dispatch(updateFxContracts(updatedFxContract));
              toast({
                description: `Deposit/Withdraw complete ${amount}`,
                status: "success",
                duration: 3000,
                isClosable: true,
              });
            }
          } catch (e) {
            console.error(e);
          }
        }
      );
    }
  }

  // get all remittance contract data on load
  useEffect(() => {
    const fetchData = async () => {
      provider.removeAllListeners();
      clearSubscriptions();
      let contract = new Contract(
        globalState.remittanceContractAddress,
        remittanceContractJson.abi,
        provider
      );
      let remitTokenAddress = await contract.getRemitTokenAddress();
      let remitTokenType = await contract.getRemitTokenType();
      dispatch(setRemitTokenAddress(remitTokenAddress));
      dispatch(setRemitTokenType(remitTokenType));

      const bankCount = await contract.getBankCount(); // -> uint8
      //TODO: if bankCount > 10 we should loop to fetch the array to keep gas costs low
      if (bankCount > 0) {
        const banksArray = await contract.getBankAddresses(0, bankCount);
        const contractsArray = await contract.getContractAddresses(
          0,
          bankCount
        );
        for (let i = 0; i < banksArray.length; i++) {
          // get fx Contract details
          const fxContract = new Contract(
            contractsArray[i],
            fxContractJson.abi,
            provider
          );

          const details = await fxContract.getDetails();
          const tokenAddress = details[3];
          const token = await queryToken(globalState.network, tokenAddress);

          const newFxContract: IFxContract = {
            bankName: details[0],
            buyRate: details[1].toString(),
            sellRate: details[2].toString(),
            currency: token.symbol,
            token: token,
            contractAddress: details[4],
            contractId: ContractId.fromEvmAddress(0, 0, details[4]).toString(),
            bankAccountId: AccountId.fromSolidityAddress(details[5]).toString(),
            bankBalanceOwn: 0,
            bankBalanceRemit: 0,
            poolBalanceOwn: 0,
            poolBalanceRemit: 0,
          };

          if (remitTokenAddress !== "") {
            try {
              const bankAccountAddress = AccountId.fromString(
                newFxContract.bankAccountId
              ).toSolidityAddress();
              const bankTokenAddress = newFxContract.token.tokenAddress;
              if (newFxContract.bankAccountId) {
                // Native tokens act like ERC20 contracts, use this behaviour for balance queries
                // balance = await queryERC20Balance(globalState.network, bankAccountId, bankTokenId);
                let balance = await queryERC20Balance(
                  globalState.network,
                  bankAccountAddress,
                  remitTokenAddress
                );
                console.log("bankBalanceRemit", Number(balance));
                newFxContract.bankBalanceRemit = Number(balance);

                balance = await queryERC20Balance(
                  globalState.network,
                  bankAccountAddress,
                  bankTokenAddress
                );
                console.log("bankBalanceOwn", Number(balance));
                newFxContract.bankBalanceOwn = Number(balance);

                balance = await queryERC20Balance(
                  globalState.network,
                  newFxContract.contractAddress,
                  remitTokenAddress
                );
                console.log("poolBalanceRemit", Number(balance));
                newFxContract.poolBalanceRemit = Number(balance);

                balance = await queryERC20Balance(
                  globalState.network,
                  newFxContract.contractAddress,
                  bankTokenAddress
                );
                console.log("poolBalanceOwn", Number(balance));
                newFxContract.poolBalanceOwn = Number(balance);
              }
            } catch (e) {
              console.error(e);
            }
            dispatch(updateFxContracts(newFxContract));
          }

          subscribeToDepositWithdraw(newFxContract);
          if (!newFxContract.token.tokenId) {
            // not a native token, subscribe to ERC20 Transfer events
            subscribeToERC20Transfer(newFxContract);
          }

          subscribeToBuySellRateUpdate(newFxContract);
        }
      }

      subscribeToRemitTokenCreated();
      subscribeToFxContractNew();
    };
    fetchData().catch(console.error);

    return () => {
      provider.removeAllListeners(); // removes every listener
      clearSubscriptions();
    };
  }, [globalState.remittanceContractAddress]);

  return <></>;
}

export default Fetcher;
