import {
    Button,
    Input,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr
} from '@chakra-ui/react';

import React, {useState} from 'react';
import {HashConnect} from "hashconnect";
import {IToken} from "../../services/types";

interface BaseContainerProps {
    hashConnect: HashConnect;
    token: IToken;
}

function ContractBankStableCoinActions({
    token
}: BaseContainerProps) {

    const [customerAccount, setCustomerAccount] = useState("");
    const [wipeAmount, setWipeAmount] = useState("");

    async function kycToken(kyc: boolean) {

    }

    async function freezeToken(freeze: boolean) {

    }

    async function wipeToken() {
        //wipeAmount
    }

    async function pauseToken(pause: boolean) {
        //pause token
    }

    const handleAccountChange = (event: any) => {
        const {type, name, value, checked} = event.target;

        setCustomerAccount(value);
    };
    const handleWipeAmountChange = (event: any) => {
        const {value} = event.target;

        setWipeAmount(value);
    };

    return (
        <Table size='sm'>
            <Thead>
                <Tr>
                    <Th>Customer Account</Th>
                    {(token.kyc) &&
                        <Th></Th>
                    }
                    {(token.freeze) &&
                        <Th></Th>
                    }
                    {(token.pausable) &&
                        <Th></Th>
                    }
                    {(token.wipe) &&
                        <Th></Th>
                    }
                </Tr>
            </Thead>
            <Tbody>
                <Tr>
                    <Td>
                        <Input type="text"
                               variant='flushed'
                               name="Customer Account"
                               placeholder="customer account id"
                               width='150px'
                               value={customerAccount}
                               onChange={handleAccountChange}
                        />
                    </Td>
                    {(token.kyc) &&
                        <Td>
                            <Button width='150px' colorScheme='green' onClick={() => kycToken(true)}>
                                Enable KYC
                            </Button>
                            <Button width='150px' colorScheme='red' onClick={() => kycToken(false)}>
                                Disable KYC
                            </Button>
                        </Td>
                    }
                    {(token.freeze) &&
                        <Td>
                            <Button width='150px' colorScheme='green' onClick={() => freezeToken(false)}>
                                UnFreeze
                            </Button>
                            <Button width='150px'  colorScheme='red' onClick={() => freezeToken(true)}>
                                Freeze
                            </Button>
                        </Td>
                    }
                    {(token.pausable) &&
                        <Td>
                            <Button width='150px' colorScheme='green' onClick={() => pauseToken(false)}>
                                UnPause
                            </Button>
                            <Button width='150px' colorScheme='red' onClick={() => pauseToken(true)}>
                                Pause
                            </Button>
                        </Td>
                    }
                    {(token.wipe) &&
                        <Td>
                            <Input type="text"
                                   variant='flushed'
                                   name="Amount to Wipe"
                                   placeholder="wipe amount"
                                   width='150px'
                                   value={wipeAmount}
                                   onChange={handleWipeAmountChange}/>
                            <Button width='150px'  colorScheme='red' onClick={() => wipeToken()}>
                                Wipe
                            </Button>
                        </Td>
                    }
                </Tr>
            </Tbody>
        </Table>
    );
};

export default ContractBankStableCoinActions;
