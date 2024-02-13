import React, { useState } from "react";

import {
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import Remittance from "../contracts/Remittance";

import { HashConnect } from "hashconnect";
import ContractTableCustomerRemittances from "../contracts/ContractTableCustomerRemittances";
import Banks from "../contracts/Banks";
import Header from "../Header";

function Landing() {
  // hashconnect
  const [hashConnect] = useState<HashConnect>(new HashConnect());

  return (
    <VStack align={"stretch"}>
      <Header hashConnect={hashConnect} />
      <Tabs>
        <TabList>
          <Tab>Remittance</Tab>
          <Tab>Banks</Tab>
          <Tab>Customers</Tab>
        </TabList>

        <TabPanels>
          <TabPanel id={"remittance"}>
            <Remittance hashConnect={hashConnect} />
          </TabPanel>
          <TabPanel id={"banks"}>
            <Banks hashConnect={hashConnect} />
          </TabPanel>
          <TabPanel id={"users"}>
            <ContractTableCustomerRemittances hashConnect={hashConnect} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}

export default Landing;
