import React, {useState} from 'react';

import {
    VStack
} from "@chakra-ui/react";
import {HashConnect} from "hashconnect";
import Banks from "../contracts/Banks";
import Header from "../Header";

function LandingBanks() {
    const [hashConnect] = useState<HashConnect>(new HashConnect());

    return (
        <VStack align={"stretch"}>
            <Header
                hashConnect={hashConnect}
            />
            <Banks hashConnect={hashConnect}/>
        </VStack>
    );
}

export default LandingBanks;
