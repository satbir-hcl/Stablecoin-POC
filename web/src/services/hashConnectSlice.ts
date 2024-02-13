import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RootState} from '../app/store';
import {HashConnectTypes} from "hashconnect";
import {HashConnectConnectionState} from "hashconnect/dist/types";

export interface HashPackAccount {
    account: string,
    topic: string
}
export interface HashConnectState {
  defaultAccount: string;
  userBalance: string;
  topic: string;
  metaData: HashConnectTypes.WalletMetadata | undefined;
  paired: boolean;
  accounts: HashPackAccount[];
}

const initialState: HashConnectState = {
    defaultAccount: "",
    accounts: [],
    userBalance: "",
    topic: "",
    metaData: undefined,
    paired: false
};

export const hashConnectSlice = createSlice({
  name: 'hashConnect',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    updatePaired: (state, action: PayloadAction<HashConnectConnectionState>) => {
        state.paired = (action.payload === HashConnectConnectionState.Connected || action.payload === HashConnectConnectionState.Paired)
    },
    updateDefaultAccount: (state, action: PayloadAction<string>) => {
      state.defaultAccount = action.payload;
    },
    updateUserBalance: (state, action: PayloadAction<string>) => {
      state.userBalance = action.payload;
    },
    updateTopic: (state, action: PayloadAction<string>) => {
      state.topic = action.payload;
    },
    updateMetadata: (state, action: PayloadAction<HashConnectTypes.WalletMetadata>) => {
      state.metaData = action.payload;
    },
    updateAccounts: (state, action: PayloadAction<HashPackAccount>) => {
        const newState = [...state.accounts];
        // check if the account already exists in the array
        const index = state.accounts.findIndex(a => a.account === action.payload.account); //finding index of the item
        if (index !== -1) {
            newState[index] = action.payload;
        } else {
            // new item, add to the array
            newState.push(action.payload);
        }
        state.accounts = newState;
    },
  },
});

export const { updateDefaultAccount, updateUserBalance, updateTopic, updateMetadata, updatePaired, updateAccounts } = hashConnectSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
// @ts-ignore
export const selectDefaultAccount = (state: RootState) => state.hashConnect.defaultAccount;
export const selectUserBalance = (state: RootState) => state.hashConnect.userBalance;
export const selectMetaData = (state: RootState) => state.hashConnect.metaData;
export const selectHashconnect = (state: RootState) => state.hashConnect;
export const selectAccounts  = (state: RootState) => state.hashConnect.accounts;
export default hashConnectSlice.reducer;
