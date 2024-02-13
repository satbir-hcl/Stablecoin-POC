import React, { useEffect, useState } from "react";

import ContractTableRemittances from "../contracts/ContractTableRemittances";
import { HashConnect } from "hashconnect";
import CustomContractsTableBanks from "./CustomContractsTableBanks";
import ContractBankStableCoin from "../contracts/ContractBankStableCoin";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectFxContracts,
  setCurrentFxContract,
  selectRemittanceContractAddress,
  selectRemitTokenId,
} from "../../services/globalStateSlice";
import { selectDefaultAccount } from "../../services/hashConnectSlice";
import { Box, Card, CardBody, CardHeader, Heading } from "@chakra-ui/react";
import BankJoinRemittanceInput from "../contracts/BankJoinRemittanceInput";

interface BaseContainerProps {
  hashConnect: HashConnect;
}

function CustomBanks({ hashConnect }: BaseContainerProps) {
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
    <Box minH={"60vh"}>
      {remittanceContractAddress && remittanceTokenId && defaultAccount && (
        <>
          {/*<ContractBankStableCoin hashConnect={hashConnect} />*/}
          {/*<BankJoinRemittanceInput hashConnect={hashConnect} />*/}
          <CustomContractsTableBanks hashConnect={hashConnect} />
          {/*<ContractTableRemittances />*/}
        </>
      )}

      {!defaultAccount && remittanceContractAddress && remittanceTokenId && (
        <Card maxH={"200px"} minW={"600px"} border={"1px solid black"} borderRadius={"0"}>
          <CardHeader bg={"white"}>
            <Heading size="md">No Account Selected</Heading>
          </CardHeader>
          <CardBody bg={"white"}>Please select an account via HashPack</CardBody>
        </Card>
      )}

      {(!remittanceContractAddress || !remittanceTokenId) && (
        <Card>
          <CardHeader bg={"white"}>
            <Heading size="md">Please complete setup</Heading>
          </CardHeader>
          <CardBody bg={"white"}>
            Set remittance contract and/or remittance token in Setup
          </CardBody>
        </Card>
      )}
    </Box>
  );
}

export default CustomBanks;
