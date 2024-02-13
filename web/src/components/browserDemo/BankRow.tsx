import {
    Button, IconButton, Input, Td, Text, Tr
} from '@chakra-ui/react';

import React from 'react';
import {AddIcon, MinusIcon} from "@chakra-ui/icons";
import Wallet from "../../classes/Wallet";
import FxContract from "../../jsContracts/FxContract";
import {REMIT} from "../../services/constants";
import {fxContractByCurrency} from "../../services/contracts";
import {balanceByName} from "../../services/balances";
import {useAppDispatch} from "../../app/hooks";
import {setAlert} from "../../services/globalStateSlice";

interface BaseContainerProps {
    fxContracts: FxContract[];
    wallet: Wallet;
    onSaveWallet: (wallet: Wallet) => void;
    onAddContract: (fxContract: FxContract) => void;
    onSaveContract: (fxContract: FxContract) => void;
}

function BankRow({
            fxContracts,
            wallet,
            onSaveWallet,
            onAddContract,
            onSaveContract,
        }: BaseContainerProps) {

    const dispatch = useAppDispatch();

    function depositAmount(wallet: Wallet, currency: string, amount: number) {
        try {
            let fxContract = fxContractByCurrency(fxContracts, wallet.ownCurrency);
            fxContract.deposit(wallet.name, currency, wallet, amount);
            onSaveWallet(wallet);
        } catch (e) {
            if (e instanceof Error) {
                dispatch(setAlert({message: e.message, isError: true}));
            }
            console.error(e);
        }
    }

    function withdrawAmount(wallet: Wallet, currency: string, amount: number) {
        try {
            let fxContract = fxContractByCurrency(fxContracts, wallet.ownCurrency);
            fxContract.withdraw(wallet.name, currency, wallet, amount);
            onSaveWallet(wallet);
        } catch (e) {
            if (e instanceof Error) {
                dispatch(setAlert({message: e.message, isError: true}));
            }
            console.error(e);
        }
    }

    function joinRemittance(wallet: Wallet) {
        try {
            const newContract = new FxContract(wallet.name, wallet.ownCurrency, wallet.sellRate, wallet.buyRate);
            onAddContract(newContract);
            wallet.joined = true;
            onSaveWallet(wallet);
        } catch (e) {
            if (e instanceof Error) {
                dispatch(setAlert({message: e.message, isError: true}));
            }
            console.error(e);
        }
    }

    const handleRateChange = (wallet: Wallet, event: any) => {
        const {type, name, value, checked} = event.target;
        // if input type is checkbox use checked
        // otherwise it's type is text, number etc. so use value
        let updatedValue = type === 'checkbox' ? checked : value;

        //if input type is number convert the updatedValue string to a +number
        if (type === 'number') {
            updatedValue = Number(updatedValue);
        }

        let buyRate = wallet.buyRate;
        let sellRate = wallet.sellRate;
        if (name === 'buyRate') {
            buyRate = updatedValue;
        }
        if (name === 'sellRate') {
            sellRate = updatedValue;
        }
        onSaveWallet(wallet.setRates(buyRate, sellRate));
    };

    function submitNewRates(wallet: Wallet) {
        try {
            const contract = fxContractByCurrency(fxContracts, wallet.ownCurrency);
            contract.setBuyRate(wallet.name, wallet.buyRate);
            contract.setSellRate(wallet.name, wallet.sellRate);
            onSaveContract(contract);
        } catch (e) {
            if (e instanceof Error) {
                dispatch(setAlert({message: e.message, isError: true}));
            }
            console.error(e);
        }
    }

    const remitTokenBalance = balanceByName(wallet.balances, REMIT).balance;
    const homeTokenBalance = balanceByName(wallet.balances, wallet.ownCurrency).balance;

    return (
        <Tr>
            <Td>{wallet.name}</Td>
            <Td textAlign={"center"}>{ homeTokenBalance.toString() }</Td>
            <Td textAlign={"center"}>
                {(wallet.joined) &&
                    <><IconButton size='sm' margin='1px'
                                  onClick={() => depositAmount(wallet, wallet.ownCurrency, 100)}
                                  aria-label='add' icon={<AddIcon/>} colorScheme='green'
                                  borderRadius="10px"/><IconButton size='sm' margin='1px'
                                                                   onClick={() => withdrawAmount(wallet, wallet.ownCurrency, 100)}
                                                                   aria-label='remove'
                                                                   icon={<MinusIcon/>}
                                                                   colorScheme='green'
                                                                   borderRadius="10px"/></>
                }
            </Td>
            <Td textAlign={"center"}>{ remitTokenBalance }</Td>
            <Td textAlign={"center"}>
                {(wallet.joined) &&
                    <><IconButton size='sm' margin='1px'
                                  onClick={() => depositAmount(wallet, REMIT, 100)}
                                  aria-label='add' icon={<AddIcon/>} colorScheme='green'
                                  borderRadius="10px"/><IconButton size='sm' margin='1px'
                                                                   onClick={() => withdrawAmount(wallet, REMIT, 100)}
                                                                   aria-label='remove'
                                                                   icon={<MinusIcon/>}
                                                                   colorScheme='green'
                                                                   borderRadius="10px"/></>
                }
            </Td>
            <Td textAlign={"center"}>
                {(!wallet.joined) &&
                    <Button onClick={() => joinRemittance(wallet)} colorScheme='purple' width="full">
                        Join
                    </Button>
                }
                {(wallet.joined) &&
                    <Text>Joined</Text>
                }
            </Td>
            <Td>
                {(wallet.joined) &&
                    <Input type="number"
                           variant='flushed'
                           name="buyRate"
                           placeholder="enter buy rate"
                           value={wallet.buyRate}
                           width='50px'
                           onChange={(e) => handleRateChange(wallet, e)}
                    />
                }
            </Td>
            <Td>
                {(wallet.joined) &&
                    <Input type="number"
                           variant='flushed'
                           name="sellRate"
                           placeholder="enter sell rate"
                           value={wallet.sellRate}
                           width='50px'
                           onChange={(e) => handleRateChange(wallet, e)}
                    />
                }
            </Td>
            <Td>
                {(wallet.joined) &&
                    <Button width="full" colorScheme='purple'
                            onClick={() => submitNewRates(wallet)}>
                        Update
                    </Button>
                }
            </Td>
        </Tr>
    );
};

export default BankRow;
