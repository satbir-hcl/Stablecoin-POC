import {
    Card, CardBody, CardHeader, Heading,
    Table, TableContainer, Tbody, Th, Thead, Tr, useToast
} from '@chakra-ui/react';

import React, {useEffect, useState} from 'react';
import ContractRowBank from '../contracts/ContractRowBank';
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
import CustomContractRowBank from './CustomContractRowBank';

interface BaseContainerProps {
    hashConnect: HashConnect;
}

function CustomContractsTableBanks({
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
            <div style={{ marginBottom: "10px" }}>
                {fxContracts.map(fxContract => {
                    return (
                        <CustomContractRowBank key={fxContract.bankName}
                            fxContract={fxContract}
                            hashConnect={hashConnect}
                            canUpdate={fxContract.bankAccountId === hashConnectData.defaultAccount}
                        />
                    );
                })}
            </div>
        </>
    );
};

export default CustomContractsTableBanks;
