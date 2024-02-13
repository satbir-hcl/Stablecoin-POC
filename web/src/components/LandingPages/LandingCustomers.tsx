import React, {useState} from 'react';

import {
    VStack
} from "@chakra-ui/react";
import {HashConnect} from "hashconnect";
import ContractTableCustomerRemittances from "../contracts/ContractTableCustomerRemittances";
import Header from "../Header";

function LandingCustomers() {
    const [hashConnect] = useState<HashConnect>(new HashConnect());

    return (
        <VStack align={"stretch"}>
            <Header
                hashConnect={hashConnect}
            />
            <ContractTableCustomerRemittances
                hashConnect={hashConnect}
            />
        </VStack>
    );
}

export default LandingCustomers;
