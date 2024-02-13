import Balance from "../classes/Balance";
import {HashConnect} from "hashconnect";
import {AccountBalance} from "@hashgraph/sdk";

export function balanceByName(balances : Balance[], currency: string) : Balance {
    const found = balances.find((balance) => {
        return balance.currency === currency;
    });
    if (found) {
        return found;
    } else {
        throw new Error(`Invalid Currency Name ${currency}`);
    }
}

export function updateWalletBalance(topic: string, defaultAccount: string, network: string) : Promise<AccountBalance> {
    const provider = new HashConnect().getProvider(network, topic, defaultAccount);
    return provider.getAccountBalance(defaultAccount);
}
