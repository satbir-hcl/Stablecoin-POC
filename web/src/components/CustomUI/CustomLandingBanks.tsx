import React, {useState} from 'react';

import {
    VStack
} from "@chakra-ui/react";
import {HashConnect} from "hashconnect";
import CustomBanks from './CustomBanks';
import Header from "../Header";
import CustomHeader from './CustomHeader';
import CustomFooter from './CustomFooter';

function CustomLandingBanks() {
    const [hashConnect] = useState<HashConnect>(new HashConnect());

    return (
        <>
            <CustomHeader hashConnect={hashConnect}/>
            <div style={{ paddingTop: "30px", background: "linear-gradient(to right, #EDF1F4, #C3CBDC)", textAlign:"center" }}>
                <strong style={{ fontSize: "2.7rem", fontFamily: "Noto Sans", fontWeight: "500" }}>Participating Banks</strong>
            </div>
            <div style={{ display: "flex", flexWrap:"wrap", justifyContent:"space-around", background: "linear-gradient(to right, #EDF1F4, #C3CBDC)", padding: "40px" }}>
                <CustomBanks hashConnect={hashConnect}/>
            </div>
            <CustomFooter/>
        </>
    );
}

export default CustomLandingBanks;
