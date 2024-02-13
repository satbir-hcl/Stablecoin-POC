import { useEffect } from "react";

import {
  Alert,
  AlertIcon,
  Box,
  Flex,
  Heading,
  HStack,
  Image,
  Button,
  Spacer,
  VStack,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Wrap,
} from "@chakra-ui/react";
import { LinkIcon, HamburgerIcon, DeleteIcon } from "@chakra-ui/icons";
import ConnectWallet from "./ConnectWallet";
import Fetcher from "./contracts/Fetcher";
import { useAppSelector } from "../app/hooks";
import {
  selectAlert,
  selectFactoryContractAddress,
  selectRemittanceContractAddress,
  selectSpinAnimation,
} from "../services/globalStateSlice";

import HEDERA_LOGO from "../assets/svg/hedera-hbar-logo.svg";
import { HashConnect } from "hashconnect";
import RemittanceDetails from "./contracts/RemittanceDetails";

interface BaseContainerProps {
  hashConnect: HashConnect | undefined;
}

function Header({ hashConnect }: BaseContainerProps) {
  //
  const alert = useAppSelector(selectAlert);
  const remittanceContractAddress = useAppSelector(
    selectRemittanceContractAddress
  );
  const factoryContractAddress = useAppSelector(selectFactoryContractAddress);
  const spinAnimation = useAppSelector(selectSpinAnimation);

  // save remittance address to localstorage
  useEffect(() => {
    if (remittanceContractAddress !== "undefined") {
      localStorage.setItem(
        "remittanceContractAddress",
        remittanceContractAddress
      );
    }
    if (factoryContractAddress !== "undefined") {
      localStorage.setItem("factoryContractAddress", factoryContractAddress);
    }
  }, [remittanceContractAddress, factoryContractAddress]);

  const reset = async () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <>
      <VStack spacing="24px" m={6} align={"start"}>
        <Flex gap="2" minWidth={"full"}>
          <Box h="60px" animation={spinAnimation}>
            <Image
              src={HEDERA_LOGO}
              alt="Hedera logo"
              w="60px"
              h="60px"
              mb="24px"
            />
          </Box>
          <Box alignItems={"center"}>
            <Heading fontSize="3xl" marginTop="10px">
              International Settlement POC Demo
            </Heading>
          </Box>
          <Spacer></Spacer>
          {hashConnect && <ConnectWallet hashConnect={hashConnect} />}
          <Box marginTop={"10px"}>
            <Menu>
              <MenuButton as={Button}>
                <HamburgerIcon></HamburgerIcon>
              </MenuButton>
              <MenuList>
                <MenuItem onClick={reset}>
                  <DeleteIcon marginRight={"10px"}></DeleteIcon>
                  Reset
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    window.open("/demo");
                  }}
                >
                  <LinkIcon marginRight={"10px"}></LinkIcon>
                  Browser Demo
                </MenuItem>
              </MenuList>
            </Menu>
          </Box>
        </Flex>
        {hashConnect && <RemittanceDetails />}
        {alert.message && (
          <Alert status={alert.isError ? "error" : "warning"}>
            <AlertIcon />
            {alert.message}
          </Alert>
        )}
      </VStack>
      {hashConnect && <Fetcher />}
    </>
  );
}

export default Header;
