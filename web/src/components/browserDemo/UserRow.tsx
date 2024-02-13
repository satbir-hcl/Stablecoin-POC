import {
    Button, HStack, Input, Select, Td, Tr,
} from '@chakra-ui/react';

import React, { useState } from 'react';
import Wallet from "../../classes/Wallet";
import FxContract from "../../jsContracts/FxContract";
import {quoteOtherRemit, quoteOwnRemit, remittanceOther, remittanceOwn} from "../../jsContracts/remittanceContract";
import {userWalletByCurrency } from "../../services/wallets";
import {balanceByName} from "../../services/balances";
import {useAppDispatch} from "../../app/hooks";
import {setAlert} from "../../services/globalStateSlice";

interface BaseContainerProps {
    fxContracts: FxContract[];
    wallet: Wallet;
    wallets: Wallet[];
    onSaveWallet: (wallet: Wallet) => void;
    onSaveContract: (fxContract: FxContract) => void;
    onSetAlertMessage: (string: string) => void;
}

function UserRow({
                     fxContracts,
                     wallet,
                     wallets,
                     onSaveWallet,
                     onSaveContract,
                     onSetAlertMessage
} : BaseContainerProps) {

    const dispatch = useAppDispatch();

    const [remit, setRemit] = useState({
        to: "",
        amount: 10
    });


    function quoteOwn() {
        onSetAlertMessage("");
        // get a quote resulting in a value in the target currency
        const quote = quoteOwnRemit(fxContracts, wallet, remit.to, remit.amount);
        const result = `${remit.amount} (${wallet.ownCurrency}) is ${quote.toFixed(2)} (${remit.to})`;
        onSetAlertMessage(result);
    }
    function quoteOther() {
        onSetAlertMessage("");
        // get a quote resulting in a value in the home currency
        const quote = quoteOtherRemit(fxContracts, wallet, remit.to, remit.amount);
        const result = `${remit.amount} (${remit.to}) is ${quote.toFixed(2)} (${wallet.ownCurrency})`;
        onSetAlertMessage(result);
    }
    function remitOwn() {
        onSetAlertMessage("");
        try {
            const destinationWallet = userWalletByCurrency(wallets, remit.to);
            const transferred = remittanceOwn(onSaveContract, onSaveWallet, fxContracts, wallet, destinationWallet, remit.amount);
            const result = `transferred ${remit.amount} (${wallet.ownCurrency}) to ${transferred.toFixed(2)} (${remit.to})`;
            onSetAlertMessage(result);
        } catch (e) {
            if (e instanceof Error) {
                dispatch(setAlert({message: e.message, isError: true}));
            }
            console.error(e);
        }
    }
    function remitOther() {
        onSetAlertMessage("");
        try {
            const destinationWallet = userWalletByCurrency(wallets, remit.to);
            const transferred = remittanceOther(onSaveContract, onSaveWallet, fxContracts, wallet, destinationWallet, remit.amount);
            const result = `transferred ${transferred.toFixed(2)} (${remit.to}) to ${remit.amount} (${wallet.ownCurrency})`;
            onSetAlertMessage(result);
        } catch (e) {
            if (e instanceof Error) {
                dispatch(setAlert({message: e.message, isError: true}));
            }
            console.error(e);
        }
    }

    const handleChange = (event: any) => {
        const { type, name, value, checked } = event.target;
        // if input type is checkbox use checked
        // otherwise it's type is text, number etc. so use value
        let updatedValue = type === 'checkbox' ? checked : value;

        //if input type is number convert the updatedValue string to a +number
        if (type === 'number') {
            updatedValue = Number(updatedValue);
        }
        const change = {
            [name]: updatedValue,
        };

        setRemit({...remit, ...change});
    };

    const balance = balanceByName(wallet.balances, wallet.ownCurrency).balance;

    let buttons;

    if (remit.to.length !== 0) {
        buttons =
            <HStack spacing='2px'>
                <Button colorScheme='purple' onClick={quoteOwn}>
                    Quote
                </Button>
                <Button colorScheme='purple' onClick={quoteOther}>
                    Quote other
                </Button>
                <Button colorScheme='purple' onClick={remitOwn}>
                    Remit
                </Button>
                <Button colorScheme='purple' onClick={remitOther}>
                    Remit other
                </Button>
            </HStack>
        ;
    }

    return (
        <Tr>
            <Td textAlign={"center"}>{wallet.name}</Td>
            <Td textAlign={"center"}>{balance} ({wallet.ownCurrency})</Td><Td>
            <Input type="number"
                   variant='flushed'
                   name="amount"
                   placeholder="enter amount"
                   value={remit.amount}
                   onChange={handleChange}/>
            </Td>
            <Td>
                <Select placeholder='enter currency'
                        variant='flushed'
                        name="to"
                        value={remit.to}
                        onChange={handleChange}
                >
                    {fxContracts.map(fxContract => {
                        if (fxContract.currency !== wallet.ownCurrency) {
                            return (
                                <option key={fxContract.currency} value={fxContract.currency}>{fxContract.currency}</option>
                            );
                        }
                        return null;
                    })}
                </Select>
            </Td>
            <Td>
                { buttons }
            </Td>
        </Tr>
    );
};

export default UserRow;
