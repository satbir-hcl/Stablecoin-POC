import {
  Button,
  Input,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";

import React, { useState } from "react";
import {
  depositERC20,
  queryERC20Balance,
  transferTokens,
} from "../../services/contracts";
import { HashConnect } from "hashconnect";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectAccounts,
  selectHashconnect,
  updateUserBalance,
} from "../../services/hashConnectSlice";
import { updateWalletBalance } from "../../services/balances";
import {
  selectCurrentFxContract,
  selectState,
  setAlert,
  setSpinAnimation,
  updateFxContracts,
} from "../../services/globalStateSlice";
import { AccountId } from "@hashgraph/sdk";

interface BaseContainerProps {
  hashConnect: HashConnect;
}

function BankContractRowTransfer({ hashConnect }: BaseContainerProps) {
  const [transfer, setTransfer] = useState({
    amount: 1000,
    destination: "",
  });

  const dispatch = useAppDispatch();
  const hashConnectData = useAppSelector(selectHashconnect);
  const walletPaired = hashConnectData.paired;
  const defaultAccount = hashConnectData.defaultAccount;
  const hashConnectTopic = hashConnectData.topic;
  const fxContract = useAppSelector(selectCurrentFxContract);
  const accounts = useAppSelector(selectAccounts);
  const globalState = useAppSelector(selectState);
  const network = globalState.network;

  const toast = useToast();
  const showToast = (message: string) => {
    toast({
      description: message,
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
  };

  const send = async () => {
    if (walletPaired && defaultAccount && fxContract) {
      dispatch(setSpinAnimation(true));
      dispatch(setAlert({ message: "", isError: false }));
      try {
        if (fxContract.token.native) {
          // native token
          await transferTokens(
            fxContract.token.tokenId,
            transfer.amount,
            transfer.destination,
            hashConnect,
            hashConnectTopic,
            defaultAccount,
            network
          );
        } else {
          await depositERC20(
            fxContract.token.tokenAddress,
            AccountId.fromString(transfer.destination).toSolidityAddress(),
            transfer.amount,
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
        const balance = await queryERC20Balance(
          network,
          AccountId.fromString(fxContract.bankAccountId).toSolidityAddress(),
          fxContract.token.tokenAddress
        );
        console.log("BankBalance", balance);
        const updatedFxContract = { ...fxContract };
        updatedFxContract.bankBalanceOwn = Number(balance);
        dispatch(updateFxContracts(updatedFxContract));
      } catch (e) {
        if (e instanceof Error) {
          dispatch(setAlert({ message: e.message, isError: true }));
        }
      }
      dispatch(setSpinAnimation(false));
    } else {
      showToast("Please choose a wallet account");
    }
  };

  const handleTransferChange = (event: any) => {
    const { type, name, value, checked } = event.target;
    // if input type is checkbox use checked
    // otherwise it's type is text, number etc. so use value
    let updatedValue = type === "checkbox" ? checked : value;

    //if input type is number convert the updatedValue string to a +number
    if (type === "number") {
      updatedValue = Number(updatedValue);
    }
    const change = {
      [name]: updatedValue,
    };

    setTransfer({ ...transfer, ...change });
  };

  return (
    <TableContainer>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Transfer Stable Coin</Th>
            <Th>To</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>
              <Input
                type="number"
                variant="flushed"
                name="amount"
                placeholder="enter amount"
                value={transfer.amount}
                onChange={handleTransferChange}
              />
            </Td>
            <Td>
              {accounts.length > 0 && (
                <Select
                  variant="flushed"
                  name="destination"
                  value={transfer.destination}
                  onChange={handleTransferChange}
                >
                  <option key={"none"} value="">
                    Select an account
                  </option>
                  {accounts.map((account) => {
                    if (account.account !== defaultAccount) {
                      return (
                        <option key={account.account} value={account.account}>
                          {account.account}
                        </option>
                      );
                    } else {
                      return null;
                    }
                  })}
                </Select>
              )}
              {/*<Input type="text"*/}
              {/*       variant='flushed'*/}
              {/*       name="destination"*/}
              {/*       placeholder="enter destination"*/}
              {/*       value={transfer.destination}*/}
              {/*       onChange={handleTransferChange}/>*/}
            </Td>
            <Td>
              <Button
                width="full"
                colorScheme="green"
                onClick={send}
                disabled={transfer.destination === ""}
              >
                Send
              </Button>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </TableContainer>
  );
}

export default BankContractRowTransfer;
