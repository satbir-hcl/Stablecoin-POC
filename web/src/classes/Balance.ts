export class Balance {

    currency: string;
    balance : number;

    constructor(currency: string, balance: number) {
        this.currency = currency;
        this.balance = balance;
    }

    public setBalance(balances: Balance[], currency: string, amount: number) : Balance[] {
        this.balance = amount;

        let updatedBalances = balances.map((b: Balance) => {
            return b.currency === currency ? this : b;
        });
        return updatedBalances;
    }
}

export default Balance;
