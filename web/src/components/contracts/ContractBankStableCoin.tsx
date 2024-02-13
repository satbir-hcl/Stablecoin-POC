import {
  Box,
  Button,
  Card,
  CardHeader,
  Flex,
  Heading,
  HStack,
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

import React, { ReactNode, useEffect, useState } from "react";
import { HashConnect } from "hashconnect";
import { IToken } from "../../services/types";
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
import { createNativeStableCoin } from "../../services/tokens";
import { dottedString } from "../../services/utils";
import CopiableDiv from "../CopiableDiv";
import ContractRowBankTransfer from "./ContractRowBankTransfer";
import ContractBankStableCoinActions from "./ContractBankStableCoinActions";
import { createERC20 } from "../../services/contracts";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";

interface BaseContainerProps {
  hashConnect: HashConnect;
}

function ContractBankStableCoin({ hashConnect }: BaseContainerProps) {
  const dispatch = useAppDispatch();
  const hashConnectData = useAppSelector(selectHashconnect);
  const walletPaired = hashConnectData.paired;
  const defaultAccount = hashConnectData.defaultAccount;
  const hashConnectTopic = hashConnectData.topic;
  const currentFxContract = useAppSelector(selectCurrentFxContract);

  const globalState = useAppSelector(selectState);
  const network = globalState.network;

  const [token, setToken] = useState<IToken>({
    native: true,
    tokenId: "",
    tokenAddress: "",
    name: "",
    symbol: "",
    freeze: false,
    freezeDefault: false,
    kyc: false,
    wipe: false,
    pausable: false,
  });

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
    if (!currentFxContract) {
      setToken({
        native: true,
        tokenId: "",
        tokenAddress: "",
        name: "",
        symbol: "",
        freeze: false,
        freezeDefault: false,
        kyc: false,
        wipe: false,
        pausable: false,
      });
    } else {
      setToken(currentFxContract.token);
    }
  }, [currentFxContract, defaultAccount]);

  const createERC20Token = async () => {
    //
    if (walletPaired && defaultAccount) {
      dispatch(setSpinAnimation(true));
      dispatch(setAlert({ message: "", isError: false }));

      const tokenToCreate = { ...token, ...{ native: false } };
      setToken(tokenToCreate);

      try {
        const tokenAddress = await createERC20(
          tokenToCreate.name,
          tokenToCreate.symbol,
          globalState.factoryContractAddress,
          hashConnect,
          hashConnectTopic,
          defaultAccount,
          network
        );
        const change = {
          tokenId: "",
          tokenAddress: tokenAddress,
        };
        dispatch(setStableTokenId(""));
        dispatch(setStableTokenAddress(tokenAddress));

        setToken({ ...token, ...change });

        updateWalletBalance(hashConnectTopic, defaultAccount, network).then(
          (balance) => {
            dispatch(updateUserBalance(balance.hbars.toString()));
          }
        );
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

  const createNativeToken = async () => {
    if (walletPaired && defaultAccount) {
      dispatch(setSpinAnimation(true));
      dispatch(setAlert({ message: "", isError: false }));

      const tokenToCreate = { ...token, ...{ native: true } };
      setToken(tokenToCreate);

      try {
        const tokenId = await createNativeStableCoin(
          tokenToCreate,
          hashConnect,
          hashConnectTopic,
          defaultAccount,
          network
        );
        const change = {
          tokenId: tokenId.toString(),
          tokenAddress: tokenId.toSolidityAddress(),
        };

        dispatch(setStableTokenId(tokenId.toString()));
        dispatch(setStableTokenAddress(tokenId.toSolidityAddress()));

        setToken({ ...token, ...change });

        updateWalletBalance(hashConnectTopic, defaultAccount, network).then(
          (balance) => {
            dispatch(updateUserBalance(balance.hbars.toString()));
          }
        );
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

    setToken({ ...token, ...change });
  };

  function tokenHeader(): ReactNode {
    if (token) {
      if (token.tokenAddress) {
        if (token.native) {
          return (
            <Heading size={"md"}>
              <HStack spacing="24px">
                <Box>Stable Coin</Box>
                <Box>
                  <CopiableDiv
                    valueToCopy={token.tokenId}
                    valueToDisplay={token.tokenId}
                  />
                </Box>
                <Box>
                  <CopiableDiv
                    valueToCopy={token.tokenAddress}
                    valueToDisplay={dottedString(token.tokenAddress)}
                  />
                </Box>
              </HStack>
            </Heading>
          );
        } else {
          return (
            <Flex>
              <Heading size={"md"}>Stable Coin</Heading>
              <Box>
                <CopiableDiv
                  valueToCopy={token.tokenAddress}
                  valueToDisplay={dottedString(token.tokenAddress)}
                />
              </Box>
            </Flex>
          );
        }
      }
    }
    return <Heading size={"md"}>Create Stable Coin</Heading>;
  }

  return (
    <Card width={"full"}>
      <CardHeader bg={"lightgray"}>{tokenHeader()}</CardHeader>
      <TableContainer>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th textAlign={"center"}>Native / ERC20</Th>
              <Th>Token Name</Th>
              <Th>Token Symbol</Th>
              <Th textAlign={"center"}>Freeze</Th>
              <Th textAlign={"center"}>Freeze Default</Th>
              <Th textAlign={"center"}>Wipe</Th>
              <Th textAlign={"center"}>Kyc</Th>
              <Th textAlign={"center"}>Pausable</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td textAlign={"center"}>
                <ToggleSwitch
                  id={"bankToken"}
                  checked={token.native}
                  optionLabels={["native", "erc20"]}
                  onChange={(checked: boolean) =>
                    setToken({ ...token, ...{ native: checked } })
                  }
                  disabled={token.tokenAddress !== ""}
                  small={false}
                />
              </Td>
              <Td>
                <Input
                  type="text"
                  variant="flushed"
                  name="name"
                  placeholder="name"
                  disabled={token.tokenAddress !== ""}
                  value={token.name}
                  onChange={handleChange}
                />
              </Td>
              <Td>
                <Input
                  type="text"
                  variant="flushed"
                  name="symbol"
                  placeholder="symbol"
                  disabled={token.tokenAddress !== ""}
                  value={token.symbol}
                  onChange={handleChange}
                />
              </Td>
              <Td textAlign={"center"}>
                <ToggleSwitch
                  id={"freeze"}
                  checked={token.freeze}
                  onChange={(checked: boolean) =>
                    setToken({ ...token, ...{ freeze: checked } })
                  }
                  disabled={token.tokenAddress !== "" || !token.native}
                  small={false}
                />
              </Td>
              <Td textAlign={"center"}>
                <ToggleSwitch
                  id={"freezeDefault"}
                  checked={token.freezeDefault}
                  onChange={(checked: boolean) =>
                    setToken({ ...token, ...{ freezeDefault: checked } })
                  }
                  disabled={token.tokenAddress !== "" || !token.native}
                  small={false}
                />
              </Td>
              <Td textAlign={"center"}>
                <ToggleSwitch
                  id={"wipe"}
                  checked={token.wipe}
                  onChange={(checked: boolean) =>
                    setToken({ ...token, ...{ wipe: checked } })
                  }
                  disabled={token.tokenAddress !== "" || !token.native}
                  small={false}
                />
              </Td>
              <Td textAlign={"center"}>
                <ToggleSwitch
                  id={"kyc"}
                  checked={token.kyc}
                  onChange={(checked: boolean) =>
                    setToken({ ...token, ...{ kyc: checked } })
                  }
                  disabled={token.tokenAddress !== "" || !token.native}
                  small={false}
                />
              </Td>
              <Td textAlign={"center"}>
                <ToggleSwitch
                  id={"pausable"}
                  checked={token.pausable}
                  onChange={(checked: boolean) =>
                    setToken({ ...token, ...{ pausable: checked } })
                  }
                  disabled={token.tokenAddress !== "" || !token.native}
                  small={false}
                />
              </Td>
              <Td>
                {!token.tokenAddress && token.native && (
                  <Button
                    width="full"
                    colorScheme="green"
                    disabled={token.name === "" || token.symbol === ""}
                    onClick={createNativeToken}
                  >
                    Create Native Stable Coin
                  </Button>
                )}
                {!token.tokenAddress && !token.native && (
                  <Button
                    width="full"
                    colorScheme="green"
                    disabled={token.name === "" || token.symbol === ""}
                    onClick={createERC20Token}
                  >
                    Create ERC20 Stable Coin
                  </Button>
                )}
              </Td>
            </Tr>
          </Tbody>
        </Table>
        {token.tokenAddress && (token.kyc || token.freeze || token.wipe) && (
          <ContractBankStableCoinActions
            token={token}
            hashConnect={hashConnect}
          />
        )}
        {token.tokenAddress && currentFxContract && (
          <ContractRowBankTransfer hashConnect={hashConnect} />
        )}
      </TableContainer>
    </Card>
  );
}

export default ContractBankStableCoin;
