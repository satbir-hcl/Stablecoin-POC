import React, { useEffect, useState } from "react";

import ContractTableRemittances from "./ContractTableRemittances";
import { HashConnect } from "hashconnect";
import ContractsTableBanks from "./ContractsTableBanks";
import ContractBankStableCoin from "./ContractBankStableCoin";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectFxContracts,
  setCurrentFxContract,
  selectRemittanceContractAddress,
  selectRemitTokenId,
} from "../../services/globalStateSlice";
import { selectDefaultAccount } from "../../services/hashConnectSlice";
import { Card, CardBody, CardHeader, Heading } from "@chakra-ui/react";
import BankJoinRemittanceInput from "./BankJoinRemittanceInput";

interface BaseContainerProps {
  hashConnect: HashConnect;
}

function Banks({ hashConnect }: BaseContainerProps) {
  const fxContracts = useAppSelector(selectFxContracts);
  const defaultAccount = useAppSelector(selectDefaultAccount);
  const remittanceContractAddress = useAppSelector(
    selectRemittanceContractAddress
  );
  const remittanceTokenId = useAppSelector(selectRemitTokenId);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!defaultAccount) {
      dispatch(setCurrentFxContract(undefined));
    } else {
      let foundFxContract = fxContracts.find((fxContract) => {
        return fxContract.bankAccountId === defaultAccount;
      });
      dispatch(setCurrentFxContract(foundFxContract));
    }
  }, [fxContracts, defaultAccount]);

  return (
    <>
      {remittanceContractAddress && remittanceTokenId && defaultAccount && (
        <>
          <ContractBankStableCoin hashConnect={hashConnect} />
          <BankJoinRemittanceInput hashConnect={hashConnect} />
          <ContractsTableBanks hashConnect={hashConnect} />
          <ContractTableRemittances />
        </>
      )}

      {!defaultAccount && remittanceContractAddress && remittanceTokenId && (
        <Card>
          <CardHeader bg={"lightgray"}>
            <Heading size="md">No Account Selected</Heading>
          </CardHeader>
          <CardBody>Please select an account via HashPack</CardBody>
        </Card>
      )}

      {(!remittanceContractAddress || !remittanceTokenId) && (
        <Card>
          <CardHeader bg={"lightgray"}>
            <Heading size="md">Please complete setup</Heading>
          </CardHeader>
          <CardBody>
            Set remittance contract and/or remittance token in Setup
          </CardBody>
        </Card>
      )}
    </>
  );
}

export default Banks;
