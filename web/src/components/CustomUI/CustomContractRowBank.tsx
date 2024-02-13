import {
    Button,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Box,
    Text,
    Card,
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
  
  function CustomContractCardBank({
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
        <Box
          //width={"30%"}
          minWidth={"720px"}
          //p={4}
          //borderRadius="md"
          //boxShadow="md"
          //border="1px"
          //borderColor="gray.200"
          //bg="white"
          //transition="transform 0.3s ease-in-out"
          //_hover={{ transform: "scale(1.02)" }}
          fontFamily={"Noto Sans"}
          fontSize={"20px"}
          mb={"30px"}
        >
          <Text fontSize="3xl" fontWeight="bold" mb={2}>
            {fxContract.bankName} ({fxContract.bankAccountId})
          </Text>
          <Text mb={2}>
            <strong>Home Balance:</strong> {fxContract.bankBalanceOwn} ({fxContract.currency})
          </Text>
    
          {/*canUpdate ? (
            <Box mb={4}>
              <strong>To/From pool: </strong>
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
            </Box>
          ) : (
            <Box></Box>
          )*/}
    
          <Text mb={2}>
            <strong>Remit Balance:</strong> {fxContract.bankBalanceRemit}
          </Text>
    
          {/*canUpdate ? (
            <Box mb={4}>
              <strong>To/From pool: </strong>
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
                  width={"100%"}
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
            </Box>
          ) : (
            <Box></Box>
          )*/}
    
          <Box mb={2}>
            {canUpdate ? (
              <>
                <strong>Buy Rate: </strong>
                <Input
                  type="number"
                  background="white"
                  height="60px"
                  fontWeight={500}
                  fontSize={"20px"}
                  border={"none"}
                  name="buyRate"
                  placeholder="enter buy rate"
                  value={buyRate.toString()}
                  onChange={(e) => handleChange(e)}
                />
              </>
            ) : (
              <Box>
                <strong>Buy Rate:</strong> {buyRate.toString()}
              </Box>
            )}
          </Box>
    
          <Box mb={2}>
            {canUpdate ? (
              <>
                <strong>Sell Rate: </strong>
                <Input
                  type="number"
                  background="white"
                  height="60px"
                  fontWeight={500}
                  fontSize={"20px"}
                  border={"none"}
                  name="sellRate"
                  placeholder="enter sell rate"
                  value={sellRate.toString()}
                  width="100%"
                  onChange={(e) => handleChange(e)}
                />
              </>
            ) : (
              <Box>
                <strong>Sell Rate:</strong> {sellRate.toString()}
              </Box>
            )}
          </Box>
    
          <Box>
            {canUpdate && (
              <Button
                marginTop={"10px"}
                marginBottom={"10px"}
                width="full"
                height={"60px"}
                background={"black"}
                color={"white"}
                disabled={!rateChanged}
                _hover={{ background: "#2f2f2f" }}
                onClick={() => submitNewRates()}
              >
                Update
              </Button>
            )}
          </Box>
        </Box>
      );
    
  }
  
  export default CustomContractCardBank;
  