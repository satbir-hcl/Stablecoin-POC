import {
    Wallet,
    LocalProvider,
    AccountCreateTransaction,
    Hbar, PrivateKey,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

async function main() {
    if (process.env.OPERATOR_ID == null || process.env.OPERATOR_KEY == null) {
        throw new Error(
            "Environment variables OPERATOR_ID, and OPERATOR_KEY are required."
        );
    }

    let wallet = new Wallet(
        process.env.OPERATOR_ID,
        process.env.OPERATOR_KEY,
        new LocalProvider()
    );

    console.log("Import the following keys into metamask for the different actors");
    // Alice
    let [key, account] = await createAccount(wallet);
    console.log(`Alice: ${key} = ${account}`);
    // Bob
    [key, account] = await createAccount(wallet);
    console.log(`Bob: ${key} = ${account}`);
    // Shinhan Bank
    [key, account] = await createAccount(wallet);
    console.log(`Shinhan Bank: ${key} = ${account}`);
    // Standard Bank
    [key, account] = await createAccount(wallet);
    console.log(`Standard Bank: ${key} = ${account}`);
}

async function createAccount(wallet) {
    let newKey = PrivateKey.generateECDSA();

    let transaction = await new AccountCreateTransaction()
        .setInitialBalance(new Hbar(20)) // 10 h
        .setKey(newKey.publicKey)
        .freezeWithSigner(wallet);

    transaction = await transaction.signWithSigner(wallet);
    let response = await transaction.executeWithSigner(wallet);
    let receipt = await response.getReceiptWithSigner(wallet);

    // @ts-ignore
    return [newKey.toStringRaw(), receipt.accountId.toString()];
}

void main();
