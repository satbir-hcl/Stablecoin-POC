import React, { useEffect } from "react";
import {
  Box,
  Button,
  Center,
  Image,
  Link,
  Select,
  VStack,
} from "@chakra-ui/react";
import { HashConnect, HashConnectTypes } from "hashconnect";
import CopiableDiv from "../CopiableDiv";

import HASHPACK_LOGO from "../../assets/png/hashpackLogo.png";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  HashPackAccount,
  selectAccounts,
  selectDefaultAccount,
  selectMetaData,
  selectUserBalance,
  updateAccounts,
  updateDefaultAccount,
  updateMetadata,
  updatePaired,
  updateTopic,
  updateUserBalance,
} from "../../services/hashConnectSlice";
import {
  selectNetwork,
  setStableTokenAddress,
  setStableTokenId,
} from "../../services/globalStateSlice";
import './styles.css'; // Import the CSS file

interface BaseContainerProps {
  hashConnect: HashConnect;
}

function CustomConnectWallet({ hashConnect }: BaseContainerProps) {
  // redux
  const dispatch = useAppDispatch();
  const defaultAccount = useAppSelector(selectDefaultAccount);
  const userBalance = useAppSelector(selectUserBalance);
  const network = useAppSelector(selectNetwork);
  const accounts = useAppSelector(selectAccounts);

  const connectHashpackHandler = async () => {
    hashConnect.connectToLocalWallet();
  };

  const handleChange = async (event: any) => {
    const { type, value, checked } = event.target;
    // if input type is checkbox use checked
    // otherwise it's type is text, number etc. so use value
    let updatedValue = type === "checkbox" ? checked : value;

    //if input type is number convert the updatedValue string to a +number
    if (type === "number") {
      updatedValue = Number(updatedValue);
    }

    let topic = "";
    dispatch(updateDefaultAccount(updatedValue));
    dispatch(setStableTokenId(""));
    dispatch(setStableTokenAddress(""));
    console.log(`Selected accounts ${updatedValue}`);
    const index = accounts.findIndex((a) => a.account === value); //finding index of the item
    if (index !== -1) {
      topic = accounts[index].topic;
      dispatch(updateTopic(topic));
    }

    const provider = hashConnect.getProvider(network, topic, updatedValue);
    const balance = await provider.getAccountBalance(updatedValue);
    dispatch(updateUserBalance(balance.hbars.toString()));
  };

  // connect to hashpack if available
  useEffect(() => {
    const fetchData = async () => {
      let appMetadata: HashConnectTypes.AppMetadata = {
        name: "International Remittance",
        description: "A Proof of concept",
        icon: "",
      };
      // @ts-ignore
      let initData = await hashConnect.init(appMetadata, network, true);
      dispatch(updateTopic(initData ? initData.topic : ""));
    };

    // call the function
    fetchData()
      // make sure to catch any error
      .catch(console.error);
  }, [hashConnect]);

  // hashpack extension found
  useEffect(() => {
    hashConnect.foundExtensionEvent.once(
      (walletMetadata: HashConnectTypes.WalletMetadata) => {
        dispatch(updateMetadata(walletMetadata));
      }
    );
  });

  // hashpack paired
  useEffect(() => {
    hashConnect.pairingEvent.on((pairingData: any) => {
      const fetchData = async () => {
        hashConnect.hcData.pairingData.forEach((pair) => {
          const hashpackAccount: HashPackAccount = {
            account: pair.accountIds[0],
            topic: pair.topic,
          };
          dispatch(updateAccounts(hashpackAccount));
        });
        dispatch(updateDefaultAccount(pairingData.accountIds[0]));
      };

      // call the function
      fetchData()
        // make sure to catch any error
        .catch(console.error);
    });
  });

  // hashconnect acknowledge data
  // useEffect(() => {
  //     hashConnect.acknowledgeMessageEvent.on((acknowledgeData: any) => {
  //         console.log(acknowledgeData);
  //     })
  // });

  // hashconnect connection changed
  useEffect(() => {
    hashConnect.connectionStatusChangeEvent.on((connectionStatus: any) => {
      dispatch(updatePaired(connectionStatus));

      hashConnect.hcData.pairingData.forEach((pair) => {
        const hashpackAccount: HashPackAccount = {
          account: pair.accountIds[0],
          topic: pair.topic,
        };
        dispatch(updateAccounts(hashpackAccount));
      });
    });
  });

  return (
    <>
      <Box>
        {!selectMetaData && (
          <Link
            href="https://www.hashpack.app/download"
            isExternal
            _hover={{ textDecoration: "none" }}
          >
            <Button variant="primary">Install Hashpack</Button>
          </Link>
        )}
      </Box>
      {accounts.length > 0 && (
        <VStack spacing={4} align="stretch">
          <Box fontFamily={"Noto Sans"}>
            <Select
              name="account"
              background={"#F6F6F6"}
              value={defaultAccount}
              onChange={handleChange}
              border="1px solid #CBD5E0"
              _focus={{ border: "1px solid #4299E1" }}
              style={{
                fontSize: "20px", // Set font size for the select
                fontWeight: "500",
                width: "240px", // Set width for the select
                height: "44px"
              }}
            >
              <option key={"none"} value=""
              
              >
                Select an account
              </option>
              {accounts.map((account) => {
                return (
                  <option key={account.account} value={account.account}
                    
                  >
                    {account.account}
                  </option>
                );
              })}
            </Select>
            <Box color={"#F6F6F6"} mt={"5px"}>
              {userBalance !== "" && (
                <CopiableDiv
                  valueToCopy={defaultAccount}
                  valueToDisplay={userBalance}
                />
              )}
            </Box>
          </Box>
        </VStack>
      )}
      {accounts.length === 0 && (
        <Box
          marginTop="15px"
          css="cursor: pointer"
          onClick={connectHashpackHandler}
        >
          Click to connect wallet
        </Box>
      )}
      <Box>
        {
          <Image className="hashpack"
            src={HASHPACK_LOGO}
            alt="Hashpack Logo"
            css="cursor: pointer"
            w="46px"
            h="46px"
            ml="30px"
            mr="10px"
            maxWidth="46px"
            background="#F6F6F6"
            borderRadius="12px"
            onClick={connectHashpackHandler}
          />
        }
      </Box>
    </>
  );
}
export default CustomConnectWallet;
