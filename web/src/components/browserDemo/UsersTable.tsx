import {
    Alert, AlertIcon, Card, CardBody, CardHeader,
    Heading, Table, TableContainer, Tbody, Th, Thead, Tr,
} from '@chakra-ui/react';

import React, { useState } from 'react';
import Wallet from "../../classes/Wallet";
import FxContract from "../../jsContracts/FxContract";
import UserRow from "./UserRow";

interface BaseContainerProps {
    fxContracts: FxContract[];
    wallets: Wallet[];
    onSaveWallet: (wallet: Wallet) => void;
    onSaveContract: (fxContract: FxContract) => void;
}

function Users({ fxContracts, wallets, onSaveWallet, onSaveContract } : BaseContainerProps) {

    const [alertMessage, setAlertMessage] = useState("");

    return (
        <Card width={"full"}>
            <CardHeader bg={"lightgray"}>
                <Heading size='md'>Customers</Heading>
            </CardHeader>
            <CardBody>
                <TableContainer>
                    <Table size='sm' variant='striped' colorScheme='linkedin'>
                        <Thead>
                            <Tr>
                                <Th>Name</Th>
                                <Th>Balance</Th>
                                <Th>Remit amount</Th>
                                <Th>To</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            { wallets.map(wallet => {
                                if ( ! wallet.isBank) {
                                    return(
                                        <UserRow key={wallet.name}
                                                 fxContracts={fxContracts}
                                                 wallet={wallet}
                                                 wallets={wallets}
                                                 onSaveWallet={onSaveWallet}
                                                 onSaveContract={onSaveContract}
                                                 onSetAlertMessage={setAlertMessage}
                                         />
                                    );
                                }
                                return null;
                            })}
                        </Tbody>
                    </Table>
                </TableContainer>
                {alertMessage && (
                    <Alert status='success' variant='top-accent'>
                        <AlertIcon/>
                        { alertMessage }
                    </Alert>
                )}
            </CardBody>
        </Card>
    );
};

export default Users;
