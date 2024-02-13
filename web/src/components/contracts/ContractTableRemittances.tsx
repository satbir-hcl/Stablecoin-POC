import {
    Card, CardBody, CardHeader,
    Heading,
    Table,
    TableContainer, Tbody,
    Th,
    Thead,
    Tr
} from '@chakra-ui/react';

import React from 'react';
import ContractRowRemittance from "./ContractRowRemittance";
import {useAppSelector} from "../../app/hooks";
import {selectFxContracts} from "../../services/globalStateSlice";

interface BaseContainerProps {
}

function ContractTableRemittances({ } : BaseContainerProps) {

    const fxContracts = useAppSelector(selectFxContracts);

    return (
        <Card width={"full"}>
            <CardHeader bg={"lightgray"}>
                <Heading size='md'>FX Contracts (LP Pools)</Heading>
            </CardHeader>
            <CardBody>
                <TableContainer>
                    <Table size='sm' variant='striped' colorScheme='linkedin'>
                        <Thead>
                            <Tr>
                                <Th>Contract</Th>
                                <Th>Buy Rate</Th>
                                <Th>Sell Rate</Th>
                                <Th>Token Balance</Th>
                                <Th>Remit Balance</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {fxContracts.map(fxContract => {
                                return (
                                    <ContractRowRemittance key={fxContract.currency}
                                                           fxContract={fxContract}
                                    />
                                );
                            })
                            }
                        </Tbody>
                    </Table>
                </TableContainer>
            </CardBody>
        </Card>
    );
};

export default ContractTableRemittances;
