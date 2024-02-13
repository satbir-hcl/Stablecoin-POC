import { useState, useEffect, useRef } from "react";
import {
  Button,
  Input,
  Table,
  TableContainer,
  Box,
  Heading,
  Tbody,
  CardBody,
  Card,
  CardHeader,
  Td,
  Tr,
  useToast,
  Th,
  Link,
  Thead,
} from "@chakra-ui/react";
import { RepeatIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { HashConnect } from "hashconnect";
import { AccountId } from "@hashgraph/sdk";

import {
  selectHashconnect,
  updateUserBalance,
} from "../../services/hashConnectSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { updateWalletBalance } from "../../services/balances";
import { createNativeStableCoin } from "../../services/tokens";
import { IRemittanceContract, IToken, tokenTypes } from "../../services/types";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";
import {
  setRemittanceContractAddress,
  setRemitTokenAddress,
  setSpinAnimation,
  setAlert,
  selectState,
  selectFactoryContractAddress,
  selectRemittanceContractAddress,
} from "../../services/globalStateSlice";
import {
  getERC20RemitTokenBalance,
  transferRemitToken,
  getDetails,
} from "../../services/remittanceContract";
import {
  createRemittanceContractViaFactory,
  createERC20TokenViaFactory,
} from "../../services/factoryContract";
import {
  handleError,
  queryMirrorBalance,
  evmAddressToHederaId,
  tokenEvmAddressToHederaId,
} from "../../services/utils";

interface BaseContainerProps {
  hashConnect: HashConnect;
}

function Remittance({ hashConnect }: BaseContainerProps) {
  const [newRemitTokenAddress, setNewRemitTokenAddress] = useState("");
  const [newRemitTokenType, setNewRemitTokenType] = useState(0);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [remittanceContract, setRemittanceContract] =
    useState<IRemittanceContract>({
      remitTokenAddress: "",
      remitTokenType: 0,
      bankCount: 0,
      bankAddresses: [],
      fxContractAddresses: [],
      remitTokenBalance: 0,
    });

  const tokenNameRef = useRef<any>();
  const tokenSymbolRef = useRef<any>();
  const remitTokenAddressRef = useRef<any>();
  const recipientAddressRef = useRef<any>();

  const [
    selectedAccountRemitTokenBalance,
    setSelectedAccountRemitTokenBalance,
  ] = useState(0);

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

  const dispatch = useAppDispatch();
  const hashConnectData = useAppSelector(selectHashconnect);
  const walletPaired = hashConnectData.paired;
  const defaultAccount = hashConnectData.defaultAccount;
  const hashConnectTopic = hashConnectData.topic;

  const globalState = useAppSelector(selectState);
  const factoryContractAddress = useAppSelector(selectFactoryContractAddress);
  const remittanceAddress = useAppSelector(selectRemittanceContractAddress);

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

  const showGreenToast = (message: string) => {
    toast({
      description: message,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (remittanceAddress === "" || hashConnectData.defaultAccount === "")
        return;
      try {
        if (remittanceAddress !== "") {
          fetchRemittanceData();
        }
      } catch (e: any) {
        showToast(e.toString());
        console.error(e);
        setIsLoading(false);
      }
    };
    fetchData().catch(console.error);
    setInterval(() => {
      setIsLoading(false);
    }, 10000);

    return;
  }, [remittanceAddress, hashConnectData.defaultAccount]);

  const fetchRemittanceData = async () => {
    if (isLoading) return;
    setIsLoading(true);
    dispatch(setSpinAnimation(true));
    const remittanceData = await getDetails(remittanceAddress);
    const _remitTokenAddress = remittanceData[2];
    const _remitTokenType = remittanceData[3];
    const _bankCount = remittanceData[4];
    const _bankAddresses = remittanceData[0];
    const _fxContractAddresses = remittanceData[1];

    let _selectedAccountBalance;
    let _remittanceContractBalance;

    if (_remitTokenType == tokenTypes.NATIVE_TOKEN) {
      const remitTokenId = tokenEvmAddressToHederaId(_remitTokenAddress);
      _selectedAccountBalance = await queryMirrorBalance(
        globalState.network,
        hashConnectData.defaultAccount,
        remitTokenId
      );
      _remittanceContractBalance = await queryMirrorBalance(
        globalState.network,
        await evmAddressToHederaId(remittanceAddress),
        remitTokenId
      );
    } else if (_remitTokenType == tokenTypes.ERC20_TOKEN) {
      _selectedAccountBalance = await getERC20RemitTokenBalance(
        _remitTokenAddress,
        AccountId.fromString(hashConnectData.defaultAccount).toSolidityAddress()
      );
      _remittanceContractBalance = await getERC20RemitTokenBalance(
        _remitTokenAddress,
        remittanceAddress
      );
    }
    setSelectedAccountRemitTokenBalance(_selectedAccountBalance);
    setRemittanceContract({
      ...remittanceContract,
      ...{
        remitTokenAddress: _remitTokenAddress,
        remitTokenType: _remitTokenType,
        bankCount: _bankCount,
        bankAddresses: _bankAddresses,
        fxContractAddresses: _fxContractAddresses,
        remitTokenBalance: _remittanceContractBalance,
      },
    });
    dispatch(setSpinAnimation(false));
    setIsLoading(false);
  };

  const changeTransferAmount = (event: any) => {
    const { value } = event.target;
    setTransferAmount(value);
  };

  const changeRecipientAddress = (event: any) => {
    const { value } = event.target;
    setRecipientAddress(value);
  };

  const changeRemitTokenAddress = (event: any) => {
    const { value } = event.target;
    setNewRemitTokenAddress(value);
  };

  const callTransferRemitToken = async () => {
    try {
      if (!(walletPaired && defaultAccount)) {
        showToast("Connect wallet or choose account");
        return;
      }
      dispatch(setSpinAnimation(true));
      dispatch(setAlert({ message: "", isError: false }));
      console.log(
        "Transfer Remit Token",
        remittanceAddress,
        remittanceContract.remitTokenAddress,
        recipientAddress
      );
      await transferRemitToken(
        remittanceContract.remitTokenAddress,
        remittanceContract.remitTokenType,
        recipientAddress,
        transferAmount,
        hashConnect,
        hashConnectTopic,
        hashConnectData.defaultAccount,
        network
      );
      showGreenToast(
        "Transfer remit token (" +
          transferAmount +
          ") to " +
          recipientAddress +
          " successfully"
      );
      fetchRemittanceData();
      dispatch(setSpinAnimation(false));
    } catch (e) {
      dispatch(setSpinAnimation(false));
      dispatch(
        setAlert({ message: await handleError(network, e), isError: true })
      );
    }
  };

  const createRemitToken = async () => {
    if (token.native) {
      createRemitTokenNative();
      return;
    }
    createRemitTokenERC20();
  };

  const createRemitTokenERC20 = async () => {
    try {
      if (!(walletPaired && defaultAccount)) {
        showToast("Connect wallet or choose account");
        return;
      }
      dispatch(setSpinAnimation(true));
      dispatch(setAlert({ message: "", isError: false }));

      const tokenAddress = await createERC20TokenViaFactory(
        factoryContractAddress,
        tokenNameRef.current?.value,
        tokenSymbolRef.current?.value,
        hashConnect,
        hashConnectTopic,
        defaultAccount,
        network
      );

      setNewRemitTokenAddress(tokenAddress);
      setNewRemitTokenType(tokenTypes.ERC20_TOKEN);
      showGreenToast("Created remit token successfully: " + tokenAddress);
    } catch (e) {
      dispatch(setSpinAnimation(false));
      dispatch(
        setAlert({ message: await handleError(network, e), isError: true })
      );
    }
  };

  const createRemitTokenNative = async () => {
    try {
      if (!(walletPaired && defaultAccount)) {
        showToast("Connect wallet or choose account");
        return;
      }

      dispatch(setSpinAnimation(true));
      dispatch(setAlert({ message: "", isError: false }));
      const tokenToCreate = { ...token, ...{ native: true } };
      tokenToCreate.name = tokenNameRef.current?.value;
      tokenToCreate.symbol = tokenSymbolRef.current?.value;
      setToken(tokenToCreate);
      const tokenId = await createNativeStableCoin(
        tokenToCreate,
        hashConnect,
        hashConnectTopic,
        defaultAccount,
        network
      );
      setNewRemitTokenAddress("0x" + tokenId.toSolidityAddress());
      setNewRemitTokenType(tokenTypes.NATIVE_TOKEN);
      showGreenToast("Created remit token successfully: " + tokenId.toString());
    } catch (e) {
      dispatch(setSpinAnimation(false));
      dispatch(
        setAlert({ message: await handleError(network, e), isError: true })
      );
    }
  };

  const createRemittanceContract = async () => {
    try {
      if (!(walletPaired && defaultAccount)) {
        showToast("Connect wallet or choose account");
        return;
      }
      dispatch(setSpinAnimation(true));
      dispatch(setAlert({ message: "", isError: false }));
      const remittanceAddress = await createRemittanceContractViaFactory(
        factoryContractAddress,
        newRemitTokenAddress,
        newRemitTokenType,
        hashConnect,
        hashConnectTopic,
        defaultAccount,
        network
      );
      dispatch(setRemitTokenAddress(newRemitTokenAddress));
      dispatch(setRemittanceContractAddress(remittanceAddress));
      showGreenToast(
        "Created remittance contract successfully " + remittanceAddress
      );
      recipientAddressRef.current.value = remittanceAddress;
      setRecipientAddress(remittanceAddress);
      dispatch(setSpinAnimation(false));
    } catch (e) {
      dispatch(setSpinAnimation(false));
      dispatch(
        setAlert({ message: await handleError(network, e), isError: true })
      );
    }
    updateWalletBalance(hashConnectTopic, defaultAccount, network).then(
      (balance) => {
        dispatch(updateUserBalance(balance.hbars.toString()));
      }
    );
    dispatch(setSpinAnimation(false));
  };

  return (
    <>
      {!factoryContractAddress && !remittanceAddress && (
        <Card>
          <CardHeader bg={"lightgray"}>
            <Heading size="md">
              No Factory or Remittance Contract Address
            </Heading>
          </CardHeader>
          <CardBody>
            Please set factory contract address or remittance contract address
          </CardBody>
        </Card>
      )}
      {(factoryContractAddress || remittanceAddress) && !defaultAccount && (
        <Card>
          <CardHeader bg={"lightgray"}>
            <Heading size="md">No Account Selected</Heading>
          </CardHeader>
          <CardBody>Please select an account via HashPack</CardBody>
        </Card>
      )}
      {(factoryContractAddress || remittanceAddress) && defaultAccount && (
        <Box>
          <Card width={"full"}>
            <CardHeader bg={"lightgray"}>
              <Heading size="md">
                Remittance Contract Detail{" "}
                <Link onClick={fetchRemittanceData}>
                  <RepeatIcon></RepeatIcon>
                </Link>
              </Heading>{" "}
            </CardHeader>
            <CardBody>
              <TableContainer>
                <Table size="sm">
                  <Tbody>
                    <Tr>
                      <Th>Remittance Contract Address</Th>
                      <Td>
                        <Link
                          href={
                            "https://hashscan.io/testnet/contract/" +
                            remittanceAddress
                          }
                          isExternal
                        >
                          {remittanceAddress} <ExternalLinkIcon mx="2px" />
                        </Link>
                      </Td>
                    </Tr>
                    <Tr>
                      <Th>Remit Token Address of Remittance Contract</Th>
                      <Td>
                        {remittanceContract.remitTokenType ==
                          tokenTypes.ERC20_TOKEN && (
                          <Link
                            href={
                              "https://hashscan.io/testnet/contract/" +
                              remittanceContract.remitTokenAddress
                            }
                            isExternal
                          >
                            {remittanceContract.remitTokenAddress}{" "}
                            <ExternalLinkIcon mx="2px" />
                          </Link>
                        )}
                        {remittanceContract.remitTokenType ==
                          tokenTypes.NATIVE_TOKEN && (
                          <Link
                            href={
                              "https://hashscan.io/testnet/token/" +
                              tokenEvmAddressToHederaId(
                                remittanceContract.remitTokenAddress
                              )
                            }
                            isExternal
                          >
                            {remittanceContract.remitTokenAddress}{" "}
                            <ExternalLinkIcon mx="2px" />
                          </Link>
                        )}
                      </Td>
                    </Tr>
                    <Tr>
                      <Th>Remit Token Type</Th>
                      <Td>
                        {remittanceContract.remitTokenType ==
                          tokenTypes.NATIVE_TOKEN && (
                          <Box>{"Native Token (HTS)"}</Box>
                        )}
                        {remittanceContract.remitTokenType ==
                          tokenTypes.ERC20_TOKEN && <Box>{"ERC20"}</Box>}
                      </Td>
                    </Tr>

                    <Tr>
                      <Th>Contract Remit Token Balance</Th>
                      <Td>{remittanceContract.remitTokenBalance}</Td>
                    </Tr>
                    <Tr>
                      <Th>Selected Account Token Balance {defaultAccount}</Th>
                      <Td>{selectedAccountRemitTokenBalance}</Td>
                    </Tr>
                    <Tr>
                      <Th>Bank Count</Th>
                      <Td>{remittanceContract.bankCount}</Td>
                    </Tr>
                    <Tr>
                      <Th>Bank Addresses</Th>
                      <Td>
                        {remittanceContract.bankCount && (
                          <div
                            dangerouslySetInnerHTML={{
                              __html:
                                '<ul style="list-style-type:none;"><li>' +
                                remittanceContract.bankAddresses.join(
                                  "</li><li>"
                                ) +
                                "</li></ul>",
                            }}
                          />
                        )}
                      </Td>
                    </Tr>
                    <Tr>
                      <Th>FX Contract Addresses</Th>
                      <Td>
                        {remittanceContract.bankCount && (
                          <div
                            dangerouslySetInnerHTML={{
                              __html:
                                '<ul style="list-style-type:none;"><li>' +
                                remittanceContract.fxContractAddresses.join(
                                  "</li><li>"
                                ) +
                                "</li></ul>",
                            }}
                          />
                        )}
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
          <Card width={"full"}>
            <CardHeader bg={"lightgray"}>
              <Heading size="md">1. Create Remit Token</Heading>
            </CardHeader>
            <CardBody>
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th textAlign={"center"}>Native / ERC20</Th>
                      <Th>Token Name</Th>
                      <Th>Token Symbol</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td width={"200px"}>
                        <ToggleSwitch
                          id={"native"}
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
                          name="tokenName"
                          variant="flushed"
                          placeholder="Token Name"
                          ref={tokenNameRef}
                          defaultValue="Remit Token"
                        />
                      </Td>
                      <Td>
                        <Input
                          type="text"
                          name="tokenSymbol"
                          variant="flushed"
                          placeholder="Token Symbol"
                          ref={tokenSymbolRef}
                          defaultValue="RTT"
                        />
                      </Td>
                      <Td width="200px">
                        <Button colorScheme="gray" onClick={createRemitToken}>
                          Create Remit Token
                        </Button>
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>

          <Card width={"full"}>
            <CardHeader bg={"lightgray"}>
              <Heading size="md">2. Create Remittance Contract</Heading>
            </CardHeader>
            <CardBody>
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th textAlign={"center"}>Native / ERC20</Th>
                      <Th>Remit Token Address</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td width={"200px"}>
                        <ToggleSwitch
                          id={"remitTokenType"}
                          checked={newRemitTokenType == tokenTypes.NATIVE_TOKEN}
                          optionLabels={["native", "erc20"]}
                          onChange={(checked: boolean) =>
                            setNewRemitTokenType(
                              checked
                                ? tokenTypes.NATIVE_TOKEN
                                : tokenTypes.ERC20_TOKEN
                            )
                          }
                          disabled={token.tokenAddress !== ""}
                          small={false}
                        />
                      </Td>
                      <Td>
                        <Input
                          type="text"
                          name="recipient"
                          variant="flushed"
                          placeholder="Remit Token Address"
                          defaultValue={newRemitTokenAddress}
                          onChange={changeRemitTokenAddress}
                          ref={remitTokenAddressRef}
                        />
                      </Td>

                      <Td width="200px" alignContent={"right"}>
                        <Button
                          alignSelf={"right"}
                          colorScheme="gray"
                          onClick={createRemittanceContract}
                        >
                          Create Remittance Contract
                        </Button>
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>

          <Card width={"full"}>
            <CardHeader bg={"lightgray"}>
              <Heading size="md">
                3. Transfer Remit Token to Remiitance Contract [Your remit token
                balance: {selectedAccountRemitTokenBalance}]
              </Heading>
            </CardHeader>
            <CardBody>
              <TableContainer>
                <Box></Box>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th textAlign={"center"}>
                        Recipient Address (remittance contract)
                      </Th>
                      <Th>Amount</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>
                        <Input
                          type="text"
                          name="recipient"
                          variant="flushed"
                          placeholder="Recipient Address"
                          onChange={changeRecipientAddress}
                          ref={recipientAddressRef}
                        />
                      </Td>
                      <Td>
                        <Input
                          type="text"
                          name="amount"
                          variant="flushed"
                          placeholder="Amount"
                          value={transferAmount}
                          onChange={changeTransferAmount}
                        />
                      </Td>
                      <Td width="200px">
                        <Button
                          colorScheme="gray"
                          onClick={callTransferRemitToken}
                        >
                          Transfer Remit Token
                        </Button>
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        </Box>
      )}
    </>
  );
}
export default Remittance;
