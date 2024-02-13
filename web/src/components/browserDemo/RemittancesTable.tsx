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
import FxContract from "../../jsContracts/FxContract";
import RemittanceRow from "./RemittanceRow";

interface BaseContainerProps {
    fxContracts: FxContract[]
}

function RemittancesTable({ fxContracts } : BaseContainerProps) {

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
                                <Th>Currency</Th>
                                <Th>Buy Rate</Th>
                                <Th>Sell Rate</Th>
                                <Th>Balances</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {fxContracts.map(fxContract => {
                                return (
                                    <RemittanceRow key={fxContract.currency}
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

export default RemittancesTable;
