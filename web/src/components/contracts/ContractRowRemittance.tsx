import {
    Td, Tr
} from '@chakra-ui/react';

import React from 'react';
import {IFxContract} from "../../services/types";

interface BaseContainerProps {
    fxContract: IFxContract;
}

function ContractRowRemittance({ fxContract } : BaseContainerProps) {
    let contractId = "";
    try {
        contractId = fxContract.contractId;
    } catch (e) {
        // do nothing
    }
    return (
        <Tr>
            <Td>
                {fxContract.currency} ({contractId})
            </Td>
            <Td textAlign={"start"}>{fxContract.buyRate}</Td>
            <Td textAlign={"start"}>{fxContract.sellRate}</Td>
            <Td textAlign={"start"}>{fxContract.poolBalanceOwn}</Td>
            <Td textAlign={"start"}>{fxContract.poolBalanceRemit}</Td>
        </Tr>
    );
};

export default ContractRowRemittance;
