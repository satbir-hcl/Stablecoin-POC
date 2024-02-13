import {
  Card,
  CardBody,
  CardHeader,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";

import React from "react";
import { useAppSelector } from "../../app/hooks";
import { selectFxContracts } from "../../services/globalStateSlice";
import ContractRowCustomerRemittance from "./ContractRowCustomerRemittance";
import { HashConnect } from "hashconnect";

interface BaseContainerProps {
  hashConnect: HashConnect;
}

function ContractTableCustomerRemittances({ hashConnect }: BaseContainerProps) {
  const fxContracts = useAppSelector(selectFxContracts);

  return (
    <Card width={"full"}>
      <CardHeader bg={"lightgray"}>
        <Heading size="md">Customer assets</Heading>
      </CardHeader>
      <CardBody>
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Token</Th>
                <Th>Balance</Th>
                <Th>Association</Th>
                <Th>Amount</Th>
                <Th>Remit Currency</Th>
                <Th>Remit to</Th>
                <Th>Quote</Th>
                <Th>Slippage</Th>
                <Th>Remit</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fxContracts.map((fxContract) => {
                console.log(fxContract.contractAddress);
                return (
                  <ContractRowCustomerRemittance
                    key={fxContract.contractAddress}
                    fxContract={fxContract}
                    hashConnect={hashConnect}
                  />
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </CardBody>
    </Card>
  );
}

export default ContractTableCustomerRemittances;
