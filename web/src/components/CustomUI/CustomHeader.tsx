import { useEffect, useState } from "react";

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
import ConnectWallet from "../ConnectWallet";
import Fetcher from "../contracts/Fetcher";
import { useAppSelector } from "../../app/hooks";
import {
  selectAlert,
  selectFactoryContractAddress,
  selectRemittanceContractAddress,
  selectSpinAnimation,
} from "../../services/globalStateSlice";

import LOGO from "../../assets/png/logo.png";
import { HashConnect } from "hashconnect";
import RemittanceDetails from "../contracts/RemittanceDetails";
import CustomConnectWallet from "./CustomConnectWallet";

interface BaseContainerProps {
  hashConnect: HashConnect | undefined;
}

function CustomHeader({ hashConnect }: BaseContainerProps) {
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

  const [fontSize, setFontSize] = useState('4xl'); // Default font size

  useEffect(() => {
    const handleResize = () => {
      // Adjust font size based on window width
      if (window.innerWidth < 1080) {
        setFontSize('24px');
      } else {
        setFontSize('4xl');
      }
    };

    // Initial font size adjustment
    handleResize();

    // Event listener for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  return (
    <>
      <div style={{ padding:"30px 80px", background: "linear-gradient(to right, #5f1ebe, #3c91ff 90%)"}}>
        <Flex gap="2" minWidth={"full"} alignItems="center">
          <Box h="60px" animation={spinAnimation}>
            <Image
              src={LOGO}
              alt="Hedera logo"
              w="60px"
              h="60px"
              minWidth={"60px"}
              borderRadius="4px"
            />
          </Box>
          <Box>
            <Heading color={"#F6F6F6"} fontSize={fontSize} fontWeight={"bold"} fontFamily={"Noto Sans"}>
              Cross-Border Remittance POC
            </Heading>
          </Box>
          <Spacer></Spacer>
          {hashConnect && <CustomConnectWallet hashConnect={hashConnect} />}
          <Box >
            <Menu>
              <MenuButton 
                as={Button}
                variant="ghost"
                _hover={{background:"#f2f2f2"}}
              >
                <HamburgerIcon boxSize={8} color="black"></HamburgerIcon>
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
                <MenuItem>{hashConnect && <RemittanceDetails />}</MenuItem>
              </MenuList>
            </Menu>
          </Box>
        </Flex>
        {/* {hashConnect && <RemittanceDetails />} */}
        {alert.message && (
          <Alert status={alert.isError ? "error" : "warning"}>
            <AlertIcon />
            {alert.message}
          </Alert>
        )}
      </div>
      {hashConnect && <Fetcher />}
    </>
  );
}

export default CustomHeader;
