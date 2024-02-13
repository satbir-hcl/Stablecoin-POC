import {
    Card, CardBody, CardHeader, Heading,
    Table, TableContainer, Tbody, Th, Thead, Tr, useToast
} from '@chakra-ui/react';

import React, {useEffect, useState} from 'react';
import ContractRowBank from "./ContractRowBank";
import {HashConnect} from "hashconnect";
import { useAppSelector} from "../../app/hooks";
import {
    selectHashconnect,
} from "../../services/hashConnectSlice";
import {
    selectFxContracts,
    selectState,
    selectRemitTokenId
} from "../../services/globalStateSlice";
import {queryMirrorBalance} from "../../services/utils";
import {IFxContract} from "../../services/types";

interface BaseContainerProps {
    hashConnect: HashConnect;
}

function ContractsTableBanks({
    hashConnect,
}: BaseContainerProps) {
    const fxContracts = useAppSelector(selectFxContracts);
    const [associateStatus, setAssociateStatus] = useState("");
    const [canAddMe, setCanAddMe] = useState(false);
    const [fxContract, setFxContract] = useState<IFxContract>();
    const remitTokenId = useAppSelector(selectRemitTokenId);
    const hashConnectData = useAppSelector(selectHashconnect);
    const globalState = useAppSelector(selectState);

    useEffect(() => {
        const fetchData = async() => {
            try {
                if (remitTokenId !== "") {
                    await queryMirrorBalance(globalState.network, hashConnectData.defaultAccount, remitTokenId);
                    setAssociateStatus("associated");
                }
            } catch (e) {
                setAssociateStatus("");
            }

            if (! hashConnectData.defaultAccount) {
                setFxContract(undefined);
            } else {
                let foundFxContract = fxContracts.find(fxContract => {
                    return fxContract.bankAccountId === hashConnectData.defaultAccount
                })
                setFxContract(foundFxContract);
            }
        }

        fetchData()
            .catch(console.error);

        return () => {
        }
    }, [fxContracts, remitTokenId, hashConnectData.defaultAccount]);

    return (
        <>
            <Card width={"full"}>
                <CardHeader bg={"lightgray"}>
                    <Heading size='md'>Participating Banks</Heading>
                </CardHeader>
                <CardBody>
                    <TableContainer>
                        <Table size='sm'>
                            <Thead>
                                <Tr>
                                    <Th>Name</Th>
                                    <Th>Home Balance</Th>
                                    <Th>to/from pool</Th>
                                    <Th>Remit Balance</Th>
                                    <Th>to/from pool</Th>
                                    <Th>Buy Rate</Th>
                                    <Th>SellRate</Th>
                                    <Th>&nbsp;</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {fxContracts.map(fxContract => {
                                    return (
                                        <ContractRowBank key={fxContract.bankName}
                                                         fxContract={fxContract}
                                                         hashConnect={hashConnect}
                                                         canUpdate={fxContract.bankAccountId === hashConnectData.defaultAccount}
                                        />
                                    );
                                })}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </CardBody>
            </Card>
        </>

    );

};

export default ContractsTableBanks;
