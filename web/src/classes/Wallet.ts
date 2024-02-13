import Balance from "./Balance";
import {REMIT} from "../services/constants";
import {balanceByName} from "../services/balances";

export class Wallet {

    name: string;
    ownCurrency: string;
    balances : Balance[] = [];
    isBank: boolean;
    buyRate: number;
    sellRate: number;
    joined: boolean;
    fxContract: string = "";

    constructor(name: string, isBank: boolean, ownCurrency: string, ownBalance: number, remitTokenBalance?: number) {
        this.name = name;
        this.isBank = isBank;
        this.ownCurrency = ownCurrency;
        this.balances = [...this.balances, new Balance(ownCurrency, ownBalance)];
        if (typeof remitTokenBalance !== 'undefined') {
            this.balances = [...this.balances, new Balance(REMIT, remitTokenBalance)];
        }
        this.buyRate = 0;
        this.sellRate = 0;
        this.joined = false;
    }

    setRates(buyRate: number, sellRate: number) : Wallet {
        this.sellRate = sellRate;
        this.buyRate = buyRate;
        return this;
    }

    adjustBalance(currency: string, amount: number) : Balance[] {
        try {
            const balance = balanceByName(this.balances, currency);
            this.balances = balance.setBalance(this.balances, currency, balance.balance + amount);
        } catch (error) {
            // add balance
            this.balances = [...this.balances, new Balance(currency, amount)];
        }
        return this.balances;
    }
}
export default Wallet;
