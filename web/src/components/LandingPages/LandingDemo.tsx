import React from 'react';
import {
    VStack
} from "@chakra-ui/react";
import BrowserDemo from "../browserDemo/BrowserDemo";
import Header from "../Header";

function LandingDemo() {
    return (
        <VStack align={"stretch"}>
            <Header
                hashConnect={undefined}
            />
            <BrowserDemo/>
        </VStack>
    );
}

export default LandingDemo;
