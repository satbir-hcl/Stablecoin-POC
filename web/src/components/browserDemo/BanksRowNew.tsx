import {
    Button, Input, Td, Tr
} from '@chakra-ui/react';

import React, { useState } from 'react';
import Wallet from "../../classes/Wallet";
import {useAppDispatch} from "../../app/hooks";
import {setAlert} from "../../services/globalStateSlice";

interface BaseContainerProps {
    onAddWallet: (wallet: Wallet) => void;
}

function BankRowNew({
            onAddWallet,
        }: BaseContainerProps) {

    const dispatch = useAppDispatch();

    const [bank, setBank] = useState({
        name: "",
        currency: "",
        buyRate: 0.9,
        sellRate: 1.1
    });

    function addBank() {
        try {
            const newWallet = new Wallet(bank.name, true, bank.currency, 2000, 2000);
            newWallet.setRates(bank.buyRate, bank.sellRate);
            onAddWallet(newWallet);
            setBank({
                name: "",
                currency: "",
                buyRate: 0.9,
                sellRate: 1.1
            });
        } catch (e) {
            if (e instanceof Error) {
                dispatch(setAlert({message: e.message, isError: true}));
            }
            console.error(e);
        }
    };

    const handleChange = (event: any) => {
        const {type, name, value, checked} = event.target;
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

        setBank({...bank, ...change});
    };

    return (
        <Tr>
            <Td colSpan={3}>
                <Input type="text"
                       variant='flushed'
                       name="name"
                       placeholder="enter name"
                       value={bank.name}
                       onChange={handleChange}/>
            </Td>
            <Td colSpan={2}>
                <Input type="text"
                       variant='flushed'
                       name="currency"
                       placeholder="enter currency"
                       value={bank.currency}
                       onChange={handleChange}/>
            </Td>
            <Td></Td>
            <Td>
                <Input type="number"
                       variant='flushed'
                       name="buyRate"
                       placeholder="enter buy rate"
                       value={bank.buyRate}
                       onChange={handleChange}/>
            </Td>
            <Td>
                <Input type="number"
                       variant='flushed'
                       name="sellRate"
                       placeholder="enter sell rate"
                       value={bank.sellRate}
                       onChange={handleChange}/>
            </Td>
            <Td>
                <Button width="full" colorScheme='green' onClick={addBank}>
                    Add
                </Button>
            </Td>
        </Tr>
    );
};

export default BankRowNew;
