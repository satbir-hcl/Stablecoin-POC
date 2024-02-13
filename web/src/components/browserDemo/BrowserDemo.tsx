import React, {useState} from 'react';

import BanksTable from "./BanksTable";
import RemittancesTable from "./RemittancesTable";
import UsersTable from "./UsersTable";
import FxContract from "../../jsContracts/FxContract";
import Wallet from "../../classes/Wallet";
import {MOCK_WALLETS} from "../../services/wallets";
import {USERNAMES} from "../../services/constants";

function BrowserDemo() {
    const [wallets, setWallets] = useState<Wallet[]>(MOCK_WALLETS);
    const [fxContracts, setContracts] = useState<FxContract[]>([]);
    const [userNames, setUserNames] = useState<string[]>(USERNAMES);
    // tabs
    const addContract = (fxContract: FxContract) => {
        setContracts([...fxContracts, fxContract]);
    }

    const saveContract = (contract: FxContract) => {
        let updatedContracts = fxContracts.map((c: FxContract) => {
            return c.currency === contract.currency ? contract : c;
        });
        setContracts(updatedContracts);
    }

    const saveWallet = (wallet: Wallet) => {
        let updatedWallets = wallets.map((w: Wallet) => {
            return w.name === wallet.name ? wallet : w;
        });
        setWallets(updatedWallets);
    }

    const addWallet = (wallet: Wallet) => {
        const userName = userNames[Math.floor(Math.random() * (userNames.length + 1))];
        const userWallet = new Wallet(userName, false, wallet.ownCurrency, 1000);
        setWallets([...wallets, wallet, userWallet]);

        // remove the user from the list to avoid collisions, however unlikely
        const newUserList = userNames.filter(function (name) {
            return name !== userName
        });

        setUserNames(newUserList);
    }

    return (
        <>
            <BanksTable onSaveWallet={saveWallet}
                        onAddWallet={addWallet}
                        onSaveContract={saveContract}
                        onAddContract={addContract}
                        fxContracts={fxContracts}
                        wallets={wallets}/>
            <RemittancesTable fxContracts={fxContracts}/>
            <UsersTable fxContracts={fxContracts}
                        wallets={wallets}
                        onSaveContract={saveContract}
                        onSaveWallet={saveWallet}
            />
        </>
    );
}

export default BrowserDemo;
