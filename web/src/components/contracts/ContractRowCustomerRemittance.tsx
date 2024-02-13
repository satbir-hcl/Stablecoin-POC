import {
  Box,
  Button,
  HStack,
  Input,
  Select,
  Td,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";

import { useEffect, useState } from "react";
import { IFxContract } from "../../services/types";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectNetwork,
  selectState,
  setAlert,
  setSpinAnimation,
} from "../../services/globalStateSlice";
import {
  selectAccounts,
  selectDefaultAccount,
  selectHashconnect,
  updateUserBalance,
} from "../../services/hashConnectSlice";
import {
  approveERC20Token,
  approve,
  associateToken,
  queryERC20Balance,
} from "../../services/contracts";
import { remitContractCall } from "../../services/remittanceContract";

import {
  quoteRemitContract,
  quoteRemitContractOther,
} from "../../services/remittanceContract";
import { updateWalletBalance } from "../../services/balances";
import { HashConnect } from "hashconnect";
import CopiableDiv from "../CopiableDiv";
import { AccountId } from "@hashgraph/sdk";
import {
  dottedString,
  handleError,
  queryMirrorBalance,
  evmAddressToHederaId,
  tokenEvmAddressToHederaId,
} from "../../services/utils";

interface BaseContainerProps {
  fxContract: IFxContract;
  hashConnect: HashConnect;
}

function ContractRowCustomerRemittance({
  fxContract,
  hashConnect,
}: BaseContainerProps) {
  const network = useAppSelector(selectNetwork);
  const globalState = useAppSelector(selectState);
  const defaultAccount = useAppSelector(selectDefaultAccount);
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(selectAccounts);
  const [quotedOwn, setQuotedOwn] = useState(false);
  const [quotedOther, setQuotedOther] = useState(false);
  const [quotedAmount, setQuotedAmount] = useState("");
  const [refresh, setRefresh] = useState("");
  const slippageOptions = [1, 2, 3, 4, 5, 10];
  const MULTIPLIER = 1_000_000;

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

  const hashConnectData = useAppSelector(selectHashconnect);

  const [remit, setRemit] = useState({
    to: "",
    fxContract: "",
    amount: 100,
    slippage: 5,
  });

  const [balance, setBalance] = useState(0);
  const [associated, setAssociated] = useState(false);
  const [associatedText, setAssociatedText] = useState("");

  const fetchData = async () => {
    if (defaultAccount) {
      if (fxContract.token.native) {
        // native token
        try {
          const balance = await queryMirrorBalance(
            network,
            defaultAccount,
            fxContract.token.tokenId
          );
          setBalance(Number(balance));
          setAssociated(true);
          setAssociatedText("Associated");
        } catch (e) {
          setBalance(0);
          setAssociated(false);
          setAssociatedText("");
        }
      } else {
        const balance = await queryERC20Balance(
          network,
          AccountId.fromString(defaultAccount).toSolidityAddress(),
          fxContract.token.tokenAddress
        );
        setBalance(Number(balance));
        setAssociated(true); // this is only for the UI to display n/a for ERC20 tokens
        setAssociatedText("n/a");
      }
    }
  };

  useEffect(() => {
    fetchData().catch(console.error);
    return () => {};
  }, [refresh, defaultAccount]);

  const associateRemitToken = async () => {
    try {
      if (!hashConnectData.defaultAccount) {
        showToast("Connect wallet or choose account");
      } else {
        dispatch(setSpinAnimation(true));
        dispatch(setAlert({ message: "", isError: false }));
        await associateToken(
          fxContract.token.tokenId,
          hashConnect,
          hashConnectData.topic,
          hashConnectData.defaultAccount,
          network
        );
        setBalance(0);
        setAssociated(true);
      }
    } catch (e) {
      dispatch(setSpinAnimation(false));
      dispatch(
        setAlert({ message: await handleError(network, e), isError: true })
      );
    }
    updateWalletBalance(
      hashConnectData.topic,
      hashConnectData.defaultAccount,
      globalState.network
    ).then((balance) => {
      dispatch(updateUserBalance(balance.hbars.toString()));
    });
    dispatch(setSpinAnimation(false));
  };

  async function quoteOwn() {
    // get a quote resulting in a value in the target currency
    const quote = await quoteRemitContract(
      globalState.remittanceContractAddress,
      fxContract.contractAddress,
      remit.fxContract,
      remit.amount
    );
    setQuotedAmount(quote);
    setQuotedOwn(true);
    setQuotedOther(false);
    dispatch(setAlert({ message: `Own quote is ${quote}`, isError: false }));
  }
  async function quoteOther() {
    // get a quote resulting in a value in the source currency
    const quote = await quoteRemitContractOther(
      globalState.remittanceContractAddress,
      fxContract.contractAddress,
      remit.fxContract,
      remit.amount
    );
    setQuotedAmount(quote);
    setQuotedOwn(false);
    setQuotedOther(true);
    dispatch(setAlert({ message: `Other quote is ${quote}`, isError: false }));
  }
  async function remitButtonPressed(amount: number, isRemitOther: boolean) {
    try {
      if (hashConnectData.paired && defaultAccount) {
        if (globalState.remittanceContractAddress) {
          dispatch(setSpinAnimation(true));
          dispatch(setAlert({ message: "", isError: false }));
          // if the remitted token is ERC20, approve first
          if (!fxContract.token.tokenId) {
            await approveERC20Token(
              fxContract.token.tokenAddress,
              fxContract.contractAddress,
              amount,
              hashConnect,
              hashConnectData.topic,
              defaultAccount,
              network
            );
            showToast(`Remit amount ${remit.amount} approved`);
          } else {
            await approve(
              tokenEvmAddressToHederaId(fxContract.token.tokenAddress),
              await evmAddressToHederaId(fxContract.contractAddress),
              amount,
              hashConnect,
              hashConnectData.topic,
              defaultAccount,
              network
            );
          }
          const [receipt, response] = await remitContractCall(
            globalState.remittanceContractAddress,
            fxContract.contractAddress,
            remit.fxContract,
            amount,
            remit.to,
            isRemitOther ? remit.amount.toString() : quotedAmount,
            remit.slippage,
            hashConnect,
            hashConnectData.topic,
            defaultAccount,
            network
          );
          if (receipt) {
            showGreenToast(`Remittance complete`);
          } else {
            throw response;
          }
        } else {
          showToast("No remittance contract defined");
        }
      } else {
        showToast("Connect wallet or choose account");
      }
    } catch (e) {
      dispatch(setSpinAnimation(false));
      dispatch(
        setAlert({ message: await handleError(network, e), isError: true })
      );
    }
    updateWalletBalance(hashConnectData.topic, defaultAccount, network).then(
      (balance) => {
        dispatch(updateUserBalance(balance.hbars.toString()));
      }
    );
    dispatch(setSpinAnimation(false));

    // Delay 5 seconds and refresh balance
    setTimeout(() => {
      setRefresh(new Date().toString());
    }, 5000);
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

    const change = {
      [name]: updatedValue,
    };

    setRemit({ ...remit, ...change });
  };

  return (
    <Tr>
      <Td>
        <VStack align={"start"}>
          <Box>{fxContract.currency}</Box>
          {fxContract.token.tokenId ? (
            <CopiableDiv
              valueToCopy={fxContract.token.tokenId}
              valueToDisplay={fxContract.token.tokenId}
            />
          ) : (
            <CopiableDiv
              valueToCopy={fxContract.token.tokenAddress}
              valueToDisplay={dottedString(fxContract.token.tokenAddress)}
            />
          )}
        </VStack>
      </Td>
      <Td>{balance}</Td>
      <Td>
        {!defaultAccount && <div>Connect wallet</div>}
        {!associated && defaultAccount && fxContract.token.tokenId ? (
          <Button onClick={associateRemitToken} colorScheme="green">
            Associate token
          </Button>
        ) : (
          <div>{associatedText}</div>
        )}
      </Td>
      <Td>
        <Input
          type="number"
          variant="flushed"
          name="amount"
          placeholder="enter amount"
          value={remit.amount}
          onChange={handleChange}
        />
      </Td>
      <Td>
        <Select
          placeholder="choose currency"
          variant="flushed"
          name="fxContract"
          value={remit.fxContract}
          onChange={handleChange}
        >
          {globalState.fxContracts.map((otherFxContract) => {
            if (otherFxContract.currency !== fxContract.currency) {
              return (
                <option
                  key={otherFxContract.currency}
                  value={otherFxContract.contractAddress}
                >
                  {otherFxContract.currency}
                </option>
              );
            }
            return null;
          })}
        </Select>
      </Td>
      <Td>
        {accounts.length > 0 && (
          <Select
            variant="flushed"
            name="to"
            value={remit.to}
            onChange={handleChange}
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
      </Td>
      <Td>
        <HStack spacing="2px">
          <Button
            colorScheme="purple"
            onClick={quoteOwn}
            isDisabled={remit.fxContract.length === 0}
          >
            Quote
          </Button>
          <Button
            colorScheme="purple"
            onClick={quoteOther}
            isDisabled={remit.fxContract.length === 0}
          >
            Quote other
          </Button>
        </HStack>
      </Td>
      <Td>
        <Select
          variant="flushed"
          name="slippage"
          value={remit.slippage}
          onChange={handleChange}
          width={"80px"}
        >
          {slippageOptions.map((slippage) => {
            return (
              <option key={slippage} value={slippage}>
                {slippage} %
              </option>
            );
          })}
        </Select>
      </Td>
      <Td>
        <HStack spacing="2px">
          <Button
            colorScheme="purple"
            onClick={() => remitButtonPressed(remit.amount, false)}
            isDisabled={remit.fxContract.length === 0 || !quotedOwn}
          >
            Remit
          </Button>
          <Button
            colorScheme="purple"
            onClick={() => remitButtonPressed(Number(quotedAmount), true)}
            isDisabled={remit.fxContract.length === 0 || !quotedOther}
          >
            Remit other
          </Button>
        </HStack>
      </Td>
    </Tr>
  );
}

export default ContractRowCustomerRemittance;
