import Wallet from "../classes/Wallet";
import {REMIT} from "../services/constants";
import Balance from "../classes/Balance";
import {balanceByName} from "../services/balances";

class FxContract {
    currency: string;
    sellRate: number; // home currency to remit rate
    buyRate: number; // remit to home currency rate
    owner: string;
    balances: Balance[] = [];

    constructor(owner: string, currency: string, sellRate: number, buyRate: number) {
        this.sellRate = sellRate;
        this.buyRate = buyRate;
        this.owner = owner;
        this.currency = currency;
        this.balances = [...this.balances, new Balance(REMIT, 0), new Balance(currency, 0)];
    }

    /**
     * sets the rate converting Remit token to home currency
     * @param owner
     * @param rate
     */
    public setBuyRate(owner: string, rate: number) {
        if (this.checkOwner(owner)) {
            this.buyRate = rate;
        } else {
            throw new Error(`${owner} not allowed to set buy rate for ${this.owner}`);
        }
    }

    /**
     * sets the rate converting home currency to Remit token
     * @param owner
     * @param rate
     */
    public setSellRate(owner: string, rate: number) {
        if (this.checkOwner(owner)) {
            this.sellRate = rate;
        } else {
            throw new Error(`${owner} not allowed to set sell rate for ${this.owner}`);
        }
    }

    /**
     * deposits currency into the fxContract
     * @param owner
     * @currency string
     * @param wallet
     * @param amount
     */
    public deposit(owner: string, currency: string, wallet: Wallet, amount: number) {
        if (this.checkOwner(owner)) {
            let balance = balanceByName(this.balances, currency);
            this.balances = balance.setBalance(this.balances, currency, balance.balance + amount);
            wallet.adjustBalance(currency, -amount);
        } else {
            throw new Error(`${owner} not allowed to deposit for ${this.owner}`);
        }
    }

    /**
     * withdraws own currency from the fxContract
     * @param owner
     * @param currency
     * @param wallet
     * @param amount
     */
    public withdraw(owner: string, currency: string, wallet: Wallet, amount: number) {
        if (this.checkOwner(owner)) {
            let balance = balanceByName(this.balances, currency)
            if (balance.balance >= amount) {
                this.balances = balance.setBalance(this.balances, currency, balance.balance - amount);
                wallet.adjustBalance(currency, amount);
            } else {
                throw new Error(`${amount} above balance ${balance.balance}`);
            }
        } else {
            throw new Error(`${owner} not allowed to withdraw for ${this.owner}`);
        }
    }

    /**
     * gets own currency from Remit token
     * @param remitTokenAmount
     * @param wallet
     */
    public getOwnFromRemit(onSaveContract: Function, onSaveWallet: Function, remitTokenAmount:number, wallet: Wallet) : number {
        // converts remit token to home currency
        const result = remitTokenAmount * this.buyRate;
        const ownBalance = balanceByName(this.balances, this.currency);
        const remitTokenBalance = balanceByName(this.balances, REMIT);
        if (result <= ownBalance.balance) {
            this.balances = remitTokenBalance.setBalance(this.balances, REMIT, remitTokenBalance.balance + remitTokenAmount);
            wallet.adjustBalance(REMIT, -remitTokenAmount);
            this.balances = ownBalance.setBalance(this.balances, this.currency, ownBalance.balance - result);
            wallet.adjustBalance(this.currency, result);
            onSaveContract(this);
            onSaveWallet(wallet);
            return result;
        } else {
            throw new Error(`buying ${remitTokenAmount} exceeds available own balance ${result}`);
        }
    }

    /**
     * gets Remit token from own currency
     * @param ownAmount
     * @param wallet
     */
    public getRemitFromOwn(onSaveContract: Function, onSaveWallet: Function, ownAmount:number, wallet: Wallet) : number {
        // converts home currency to remit token
        const result = ownAmount * this.sellRate;
        const ownBalance = balanceByName(this.balances, this.currency);
        const remitTokenBalance = balanceByName(this.balances, REMIT);
        if (result <= remitTokenBalance.balance) {
            let newBalance = ownBalance.balance + ownAmount;
            this.balances = ownBalance.setBalance(this.balances, this.currency, newBalance);
            wallet.adjustBalance(this.currency, -ownAmount);
            newBalance = remitTokenBalance.balance - result;
            this.balances = remitTokenBalance.setBalance(this.balances, REMIT, newBalance);
            wallet.adjustBalance(REMIT, result);

            onSaveContract(this);
            onSaveWallet(wallet);
            return result;
        } else {
            throw new Error(`buying ${ownAmount} exceeds available remit token balance ${result}`);
        }
    }

    /**
     * checks the owner of this fx rate
     * @param owner
     */
    private checkOwner (owner: string) : boolean {
        return (this.owner === owner);
    }
}
export default FxContract;
