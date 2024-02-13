import {
    Td, Tr
} from '@chakra-ui/react';

import React from 'react';
import FxContract from "../../jsContracts/FxContract";
import {REMIT} from "../../services/constants";

interface BaseContainerProps {
    fxContract: FxContract;
}

function RemittanceRow({ fxContract } : BaseContainerProps) {

    let remitTokenBalance = 0;
    let ownTokenBalance = 0;

    fxContract.balances.forEach(function (contractBalance) {
        if (contractBalance.currency === REMIT) {
            remitTokenBalance = contractBalance.balance;
        } else {
            ownTokenBalance = contractBalance.balance;
        }
    });

    return (

        <Tr>
            <Td textAlign={"center"}>
                {fxContract.currency}
            </Td>
            <Td textAlign={"center"}>{fxContract.buyRate}</Td>
            <Td textAlign={"center"}>{fxContract.sellRate}</Td>
            <Td textAlign={"start"}>{ownTokenBalance} ({fxContract.currency}) / {remitTokenBalance} ({ REMIT })</Td>
        </Tr>
    );
};

export default RemittanceRow;
