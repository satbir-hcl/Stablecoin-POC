import FxContract from "./FxContract";
import Wallet from "../classes/Wallet";
import {fxContractByCurrency} from "../services/contracts";

    export function quoteOwnRemit(fxContracts: FxContract[], wallet: Wallet, currency: string, amount: number) : number {
        // calculates the conversion rate from own to other
        let fxContract = fxContractByCurrency(fxContracts, wallet.ownCurrency);
        const ownToRemitToken = amount * fxContract.sellRate;
        fxContract = fxContractByCurrency(fxContracts, currency);
        const remitTokentoOther = ownToRemitToken * fxContract.buyRate;
        return remitTokentoOther;
    }

    export function quoteOtherRemit(fxContracts: FxContract[], wallet: Wallet, currency: string, amount: number) : number {
        // calculates the conversion rate from other to own
        let fxContract = fxContractByCurrency(fxContracts, currency);
        const otherToRemitToken = amount * fxContract.sellRate;
        fxContract = fxContractByCurrency(fxContracts, wallet.ownCurrency);
        const remitTokenToOwn = otherToRemitToken * fxContract.buyRate;
        return remitTokenToOwn;
    }

    export function remittanceOwn(onSaveContract: Function, onSaveWallet: Function, fxContracts: FxContract[], fromWallet: Wallet, destinationWallet: Wallet, amount : number) : number {
        // Alice sends 10 eZar to Bob (eWon)
        // 10 eZar from Alice to eZAR FX
        // Remit token from eZAR fz to eWON fx
        // 10 eWon from eWonFX to Bob

        const ownCurrencyContract = fxContractByCurrency(fxContracts, fromWallet.ownCurrency);
        const remitTokenAmount = ownCurrencyContract.getRemitFromOwn(onSaveContract, onSaveWallet, amount, fromWallet);

        const destinationContract = fxContractByCurrency(fxContracts, destinationWallet.ownCurrency);
        return destinationContract.getOwnFromRemit(onSaveContract, onSaveWallet, remitTokenAmount, destinationWallet);
    }

    export function remittanceOther(onSaveContract: Function, onSaveWallet: Function, fxContracts: FxContract[], fromWallet: Wallet, toWallet: Wallet, amount : number) {
        // converts other currency to own and transfers to destination
        // get a quote
        const quote = quoteOtherRemit(fxContracts, fromWallet, toWallet.ownCurrency, amount);
        // now remit Own using this amount
        return remittanceOwn(onSaveContract, onSaveWallet, fxContracts, fromWallet, toWallet, quote);
    }
