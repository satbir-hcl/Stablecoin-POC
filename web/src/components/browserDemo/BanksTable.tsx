import {
    Card, CardBody, CardHeader, Heading,
    Table, TableContainer, Tbody, Th, Thead, Tr
} from '@chakra-ui/react';

import React from 'react';
import Wallet from "../../classes/Wallet";
import FxContract from "../../jsContracts/FxContract";
import {REMITTANCE} from "../../services/constants";
import BankRow from "./BankRow";
import BankRowNew from "./BanksRowNew";

interface BaseContainerProps {
    fxContracts: FxContract[];
    wallets: Wallet[];
    onAddWallet: (wallet: Wallet) => void;
    onSaveWallet: (wallet: Wallet) => void;
    onAddContract: (fxContract: FxContract) => void;
    onSaveContract: (fxContract: FxContract) => void;
}

function BanksTable({
                        fxContracts,
                        wallets,
                        onAddWallet,
                        onSaveWallet,
                        onAddContract,
                        onSaveContract,
                    }: BaseContainerProps) {

    return (
        <Card width={"full"}>
            <CardHeader bg={"lightgray"}>
                <Heading size='md'>Participating Banks</Heading>
            </CardHeader>
            <CardBody>
                <TableContainer>
                    <Table size='sm' variant='striped' colorScheme='linkedin'>
                        <Thead>
                            <Tr>
                                <Th>Name</Th>
                                <Th>Home Balance</Th>
                                <Th>to/from pool</Th>
                                <Th>Remit Balance</Th>
                                <Th>to/from pool</Th>
                                <Th>Join</Th>
                                <Th>Buy Rate</Th>
                                <Th>SellRate</Th>
                                <Th>&nbsp;</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {wallets.map(wallet => {
                                if ((wallet.isBank && wallet.name !== REMITTANCE)) {
                                    return (
                                        <BankRow key={wallet.name}
                                                 fxContracts={fxContracts}
                                                 wallet={wallet}
                                                 onSaveWallet={onSaveWallet}
                                                 onAddContract={onAddContract}
                                                 onSaveContract={onSaveContract}
                                        />
                                    );
                                }
                                return null;
                            })}

                            <BankRowNew
                                onAddWallet={onAddWallet}
                            />
                        </Tbody>
                    </Table>
                </TableContainer>
            </CardBody>
        </Card>
    );

};

export default BanksTable;
