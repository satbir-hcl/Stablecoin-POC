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
  import ContractRowCustomerRemittance from "../contracts/ContractRowCustomerRemittance";
  import { HashConnect } from "hashconnect";
import CustomContractRowCustomerRemittance from "./CustomContractRowCustomerRemittance";
  
  interface BaseContainerProps {
    hashConnect: HashConnect;
  }
  
  function CustomContractTableCustomerRemittances({ hashConnect }: BaseContainerProps) {
    const fxContracts = useAppSelector(selectFxContracts);
  
    return (
      <div>
        <div>
          {fxContracts.map((fxContract, ind) => {
            console.log(fxContract.contractAddress);
            return (
              <>
                <CustomContractRowCustomerRemittance
                  key={fxContract.contractAddress}
                  fxContract={fxContract}
                  hashConnect={hashConnect}
                  index={ind + 1}
                />
              </>
            );
          })}
        </div>
      </div>
    );
  }
  
  export default CustomContractTableCustomerRemittances;
  