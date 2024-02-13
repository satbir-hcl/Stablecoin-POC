import {
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Td,
  Tr,
  useToast,
} from "@chakra-ui/react";

import React, { useState } from "react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import {
  approveERC20Token,
  deposit,
  approve,
  depositERC20,
  updateRates,
  withdraw,
} from "../../services/contracts";
import { updateWalletBalance } from "../../services/balances";
import { HashConnect } from "hashconnect";
import { IFxContract, tokenTypes } from "../../services/types";
import {
  evmAddressToHederaId,
  tokenEvmAddressToHederaId,
} from "../../services/utils";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectHashconnect,
  updateUserBalance,
} from "../../services/hashConnectSlice";
import { selectState } from "../../services/globalStateSlice";
import { BigNumber } from "ethers";

interface BaseContainerProps {
  fxContract: IFxContract;
  hashConnect: HashConnect;
  canUpdate: boolean;
}

function ContractRowBank({
  fxContract,
  hashConnect,
  canUpdate,
}: BaseContainerProps) {
  const hashConnectData = useAppSelector(selectHashconnect);
  const walletPaired = hashConnectData.paired;
  const defaultAccount = hashConnectData.defaultAccount;
  const hashConnectTopic = hashConnectData.topic;

  const globalState = useAppSelector(selectState);
  const remitTokenAddress = globalState.remitTokenAddress;
  const remitTokenType = globalState.remitTokenType;
  const network = globalState.network;

  const [rateChanged, setRateChanged] = useState<boolean>(false);
  const [buyRate, setBuyRate] = useState<string>(fxContract.buyRate);
  const [sellRate, setSellRate] = useState<string>(fxContract.sellRate);
  const [remitAmount, setRemitAmount] = useState<string>("1000");
  const [stableAmount, setStableAmount] = useState<string>("1500");

  const dispatch = useAppDispatch();
  const toast = useToast();

  const showToast = (message: string) => {
    toast({
      description: message,
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
  };

  async function depositAmount(
    tokenAddress: string,
    tokenType: number,
    amount: number
  ) {
    if (walletPaired && defaultAccount) {
      console.log("FXContract", fxContract.token, tokenAddress);
      console.log("RemitTokenType", remitTokenType);
      console.log("RemitTokenAddress", remitTokenAddress);
      if (tokenType == tokenTypes.NATIVE_TOKEN) {
        await approve(
          tokenEvmAddressToHederaId(tokenAddress),
          await evmAddressToHederaId(fxContract.contractAddress),
          amount,
          hashConnect,
          hashConnectTopic,
          defaultAccount,
          network
        );
        // native tokens
        await deposit(
          fxContract.contractAddress,
          tokenAddress,
          amount,
          hashConnect,
          hashConnectTopic,
          defaultAccount,
          network
        );
      } else {
        // stable coin is ERC20
        await depositERC20(
          tokenAddress,
          fxContract.contractAddress,
          amount,
          hashConnect,
          hashConnectTopic,
          defaultAccount,
          network
        );
      }

      updateWalletBalance(hashConnectTopic, defaultAccount, network).then(
        (balance) => {
          dispatch(updateUserBalance(balance.hbars.toString()));
        }
      );
    } else {
      showToast("Please choose a wallet account");
    }
  }

  async function withdrawAmount(tokenAddress: string, amount: number) {
    if (walletPaired && defaultAccount) {
      await withdraw(
        fxContract.contractAddress,
        tokenAddress,
        amount,
        hashConnect,
        hashConnectTopic,
        defaultAccount,
        network
      );
      updateWalletBalance(hashConnectTopic, defaultAccount, network).then(
        (balance) => {
          dispatch(updateUserBalance(balance.hbars.toString()));
        }
      );
    } else {
      showToast("Please choose a wallet account");
    }
  }

  const handleChange = (event: any) => {
    const { type, name, value, checked } = event.target;
    // if input type is checkbox use checked
    // otherwise it's type is text, number etc. so use value
    let updatedValue = type === "checkbox" ? checked : value;

    //if input type is number convert the updatedValue string to a +number
    if (type === "number") {
      updatedValue = Number(updatedValue);
    }
    if (name === "buyRate") {
      setBuyRate(updatedValue);
      setRateChanged(true);
    } else if (name === "sellRate") {
      setSellRate(updatedValue);
      setRateChanged(true);
    } else if (name === "remitAmount") {
      setRemitAmount(value);
    } else if (name === "stableAmount") {
      setStableAmount(value);
    }
  };

  async function submitNewRates() {
    if (walletPaired && defaultAccount) {
      if (rateChanged) {
        await updateRates(
          fxContract.contractAddress,
          buyRate,
          sellRate,
          hashConnect,
          hashConnectTopic,
          defaultAccount,
          network
        );
        setRateChanged(false);
      }

      updateWalletBalance(hashConnectTopic, defaultAccount, network).then(
        (balance) => {
          dispatch(updateUserBalance(balance.hbars.toString()));
        }
      );
    } else {
      showToast("Please choose a wallet account");
    }
  }

  return (
    <Tr>
      <Td>
        {fxContract.bankName} ({fxContract.bankAccountId})
      </Td>
      <Td>
        {fxContract.bankBalanceOwn} ({fxContract.currency})
      </Td>

      {canUpdate ? (
        <Td textAlign={"center"}>
          <InputGroup size="sm">
            <InputLeftElement>
              <IconButton
                size="sm"
                margin="1px"
                onClick={() =>
                  withdrawAmount(
                    fxContract.token.tokenAddress,
                    Number(remitAmount)
                  )
                }
                aria-label="remove"
                icon={<MinusIcon />}
                colorScheme="green"
                borderRadius="10px"
              />
            </InputLeftElement>
            <Input
              type="text"
              text-align={"right"}
              variant="flushed"
              name="remitAmount"
              placeholder="amount"
              value={remitAmount}
              onChange={(e) => handleChange(e)}
            />
            <InputRightElement>
              <IconButton
                size="sm"
                margin="1px"
                onClick={() =>
                  depositAmount(
                    fxContract.token.tokenAddress,
                    +!fxContract.token.native,
                    Number(remitAmount)
                  )
                }
                aria-label="add"
                icon={<AddIcon />}
                colorScheme="green"
                borderRadius="10px"
              />
            </InputRightElement>
          </InputGroup>
        </Td>
      ) : (
        <Td></Td>
      )}

      <Td textAlign={"center"}>{fxContract.bankBalanceRemit}</Td>
      {canUpdate ? (
        <Td textAlign={"center"}>
          <InputGroup size="sm">
            <InputLeftElement>
              <IconButton
                size="sm"
                margin="1px"
                onClick={() =>
                  withdrawAmount(remitTokenAddress, Number(stableAmount))
                }
                aria-label="remove"
                icon={<MinusIcon />}
                colorScheme="green"
                borderRadius="10px"
              />
            </InputLeftElement>
            <Input
              type="text"
              variant="flushed"
              width={"100px"}
              name="stableAmount"
              placeholder="amount"
              value={stableAmount}
              onChange={(e) => handleChange(e)}
            />
            <InputRightElement>
              <IconButton
                size="sm"
                margin="1px"
                onClick={() =>
                  depositAmount(
                    remitTokenAddress,
                    remitTokenType,
                    Number(stableAmount)
                  )
                }
                aria-label="add"
                icon={<AddIcon />}
                colorScheme="green"
                borderRadius="10px"
              />
            </InputRightElement>
          </InputGroup>
        </Td>
      ) : (
        <Td></Td>
      )}
      <Td>
        {canUpdate ? (
          <Input
            type="number"
            variant="flushed"
            name="buyRate"
            placeholder="enter buy rate"
            value={buyRate.toString()}
            width="50px"
            onChange={(e) => handleChange(e)}
          />
        ) : (
          <div>{buyRate.toString()}</div>
        )}
      </Td>
      <Td>
        {canUpdate ? (
          <Input
            type="number"
            variant="flushed"
            name="sellRate"
            placeholder="enter sell rate"
            value={sellRate.toString()}
            width="50px"
            onChange={(e) => handleChange(e)}
          />
        ) : (
          <div>{sellRate.toString()}</div>
        )}
      </Td>
      <Td>
        {canUpdate && (
          <Button
            width="full"
            colorScheme="purple"
            disabled={!rateChanged}
            onClick={() => submitNewRates()}
          >
            Update
          </Button>
        )}
      </Td>
    </Tr>
  );
}

export default ContractRowBank;
