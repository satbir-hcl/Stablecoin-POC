import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";

import { AccountId } from "@hashgraph/sdk";
import React, { useEffect, useState } from "react";
import { joinRemittance } from "../../services/remittanceContract";
import { createFXContractViaFactory } from "../../services/factoryContract";
import { tokenTypes } from "../../services/types";
import { HashConnect } from "hashconnect";
import { IFxContract } from "../../services/types";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectHashconnect,
  updateUserBalance,
} from "../../services/hashConnectSlice";
import { updateWalletBalance } from "../../services/balances";
import {
  selectCurrentFxContract,
  selectState,
  setAlert,
  setSpinAnimation,
  setStableTokenAddress,
  setStableTokenId,
} from "../../services/globalStateSlice";
import { handleError, queryToken } from "../../services/utils";
import { TokenId } from "@hashgraph/sdk";

interface BaseContainerProps {
  hashConnect: HashConnect;
}

const MULTIPLIER = 1000000;

function BankJoinRemittanceInput({ hashConnect }: BaseContainerProps) {
  const [bank, setBank] = useState({
    name: "",
    currency: "",
    buyRate: 900000,
    sellRate: 1100000,
  });

  const dispatch = useAppDispatch();
  const hashConnectData = useAppSelector(selectHashconnect);
  const walletPaired = hashConnectData.paired;
  const defaultAccount = hashConnectData.defaultAccount;
  const hashConnectTopic = hashConnectData.topic;
  const currentFxContract = useAppSelector(selectCurrentFxContract);

  const globalState = useAppSelector(selectState);
  const remittanceAddress = globalState.remittanceContractAddress;
  const factoryAddress = globalState.factoryContractAddress;
  const network = globalState.network;

  const [tokenAddressOrId, setTokenAddressOrId] = useState("");

  const toast = useToast();
  const showToast = (message: string) => {
    toast({
      description: message,
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
  };

  useEffect(() => {
    if (globalState.stableTokenId === "") {
      setTokenAddressOrId(globalState.stableTokenAddress);
    }

    return () => {};
  }, [globalState.stableTokenAddress]);

  useEffect(() => {
    setTokenAddressOrId(globalState.stableTokenId);

    return () => {};
  }, [globalState.stableTokenId]);

  const join = async () => {
    if (walletPaired && defaultAccount) {
      dispatch(setSpinAnimation(true));
      dispatch(setAlert({ message: "", isError: false }));

      let tempTokenAddress = tokenAddressOrId;

      if (tempTokenAddress.includes("0.0.")) {
        tempTokenAddress =
          TokenId.fromString(tokenAddressOrId).toSolidityAddress();
      }

      const token = await queryToken(network, tempTokenAddress);

      const fxContract: IFxContract = {
        bankName: bank.name,
        buyRate: (Number(bank.buyRate) * MULTIPLIER).toString(),
        contractAddress: "",
        contractId: "",
        currency: bank.currency.toString(),
        sellRate: bank.sellRate.toString(),
        token: token,
        bankAccountId: "",
        bankBalanceOwn: 0,
        bankBalanceRemit: 0,
        poolBalanceOwn: 0,
        poolBalanceRemit: 0,
      };

      const bankTokenType = token.native
        ? tokenTypes.NATIVE_TOKEN
        : tokenTypes.ERC20_TOKEN;

      try {
        const fxContractAddress = await createFXContractViaFactory(
          remittanceAddress,
          bank.name,
          AccountId.fromString(defaultAccount).toSolidityAddress(),
          token.tokenAddress,
          bankTokenType,
          bank.buyRate,
          bank.sellRate,
          factoryAddress,
          hashConnect,
          hashConnectTopic,
          defaultAccount,
          network
        );
        console.log("Deploy FX Contract successfully", fxContractAddress);
        fxContract.contractAddress = fxContractAddress;

        await joinRemittance(
          bank.name,
          token.tokenAddress,
          fxContract.contractAddress,
          remittanceAddress,
          hashConnect,
          hashConnectTopic,
          defaultAccount,
          network
        );
        console.log("Join Remittance Contract Successfully");
        dispatch(setStableTokenAddress(""));
        dispatch(setStableTokenId(""));
        updateWalletBalance(hashConnectTopic, defaultAccount, network).then(
          (balance) => {
            dispatch(updateUserBalance(balance.hbars.toString()));
          }
        );
      } catch (e) {
        dispatch(
          setAlert({ message: await handleError(network, e), isError: true })
        );
      }
      dispatch(setSpinAnimation(false));
    } else {
      showToast("Please choose a wallet account");
    }
  };

  const handleChange = (event: any) => {
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

    setBank({ ...bank, ...change });
  };

  const handleTokenIdOrAddressChange = (event: any) => {
    const { value } = event.target;
    // if input type is checkbox use checked
    // otherwise it's type is text, number etc. so use value
    setTokenAddressOrId(value);
  };

  return (
    <>
      {!currentFxContract ? (
        <Card width={"full"}>
          <CardHeader bg={"lightgray"}>
            <Heading size={"md"}>Join Remittance</Heading>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Bank Name</Th>
                    <Th>StableCoin Token Id/Address</Th>
                    <Th textAlign={"center"}>Buy Rate</Th>
                    <Th textAlign={"center"}>Sell Rate</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td maxWidth={100}>
                      <Input
                        type="text"
                        variant="flushed"
                        name="name"
                        placeholder="enter bank name"
                        value={bank.name}
                        onChange={handleChange}
                      />
                    </Td>
                    <Td>
                      <Input
                        type="text"
                        variant="flushed"
                        name="currency"
                        placeholder="enter token Id / address"
                        value={tokenAddressOrId}
                        onChange={handleTokenIdOrAddressChange}
                      />
                    </Td>
                    <Td textAlign={"center"}>
                      <Input
                        type="number"
                        variant="flushed"
                        name="buyRate"
                        placeholder="enter buy rate"
                        value={bank.buyRate}
                        maxWidth={100}
                        onChange={handleChange}
                      />
                    </Td>
                    <Td textAlign={"center"}>
                      <Input
                        type="number"
                        variant="flushed"
                        name="sellRate"
                        placeholder="enter sell rate"
                        value={bank.sellRate}
                        maxWidth={100}
                        onChange={handleChange}
                      />
                    </Td>
                    <Td>
                      <Button
                        width="full"
                        colorScheme="green"
                        onClick={join}
                        disabled={bank.name === "" || tokenAddressOrId === ""}
                      >
                        Add Me
                      </Button>
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}

export default BankJoinRemittanceInput;
