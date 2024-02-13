import Wallet from "../classes/Wallet";
import {ALICE, BOB, EWON, EZAR, REMITTANCE, SHINHAN_BANK, STANDARD_BANK, REMIT} from "./constants";

export const MOCK_WALLETS = [
    new Wallet(REMITTANCE, true, REMIT, 0),
    // new Wallet(STANDARD_BANK, true, EZAR, 1000, 2000).setRates(0.9, 1.1),
    // new Wallet(SHINHAN_BANK, true, EWON, 1000, 2000).setRates(0.8, 1.2),
    new Wallet(STANDARD_BANK, true, EZAR, 1000, 2000).setRates(1, 1),
    new Wallet(SHINHAN_BANK, true, EWON, 1000, 2000).setRates(1, 1),
    new Wallet(ALICE, false, EZAR, 1000),
    new Wallet(BOB, false, EWON, 1000)
];

export function walletByName(wallets : Wallet[], name: string) : Wallet {
    const found = wallets.find((wallet) => {
        return wallet.name === name;
    });
    if (found) {
        return found;
    } else {
        throw new Error(`Invalid Wallet Name ${name}`);
    }
}

export function userWalletByCurrency(wallets : Wallet[], currency: string) : Wallet {
    const found = wallets.find((wallet) => {
        return (wallet.ownCurrency === currency) && ( ! wallet.isBank);
    });
    if (found) {
        return found;
    } else {
        throw new Error(`Invalid Wallet Name ${currency}`);
    }
}