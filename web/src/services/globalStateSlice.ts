import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../app/store";
import { IFxContract } from "./types";
import { keyframes } from "@chakra-ui/react";
import { TokenId } from "@hashgraph/sdk";

export interface AlertMessage {
  message: string;
  isError: boolean;
}

export interface GlobalState {
  stableTokenId: string;
  stableTokenAddress: string;
  alertMessage: AlertMessage;
  fxContracts: IFxContract[];
  factoryContractAddress: string;
  remittanceContractAddress: string;
  remitTokenAddress: string;
  remitTokenType: number;
  remitTokenId: string;
  spinAnimation: string;
  network: string;
  currentFxContract: IFxContract | undefined;
}

const initialState: GlobalState = {
  currentFxContract: undefined,
  stableTokenId: "",
  stableTokenAddress: "",
  alertMessage: {
    message: "",
    isError: false,
  },
  fxContracts: [],
  factoryContractAddress:
    window.localStorage.getItem("factoryContractAddress") ?? "",
  remittanceContractAddress:
    window.localStorage.getItem("remittanceContractAddress") ?? "",
  remitTokenAddress: "",
  remitTokenType: 0,
  remitTokenId: "",
  spinAnimation: "",
  network: process.env.REACT_APP_NETWORK
    ? process.env.REACT_APP_NETWORK
    : "testnet",
};

const spin = keyframes`
        0% {transform: rotate(0deg);}
        25% {transform: rotate(45deg);}
        50% {transform: rotate(90deg);}
        75% {transform: rotate(135deg);}
        100% {transform: rotate(180deg);}
   `;
const spinningStyle = `${spin} infinite 1s linear`;

export const globalStateSlice = createSlice({
  name: "state",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setAlert: (state, action: PayloadAction<AlertMessage>) => {
      state.alertMessage = action.payload;
    },
    setCurrentFxContract(
      state,
      action: PayloadAction<IFxContract | undefined>
    ) {
      state.currentFxContract = action.payload;
    },
    updateFxContracts: (state, action: PayloadAction<IFxContract>) => {
      const newState = [...state.fxContracts];
      // check if the contract already exists in the array
      const index = state.fxContracts.findIndex(
        (c) => c.bankName === action.payload.bankName
      ); //finding index of the item
      if (index !== -1) {
        newState[index] = action.payload;
      } else {
        // new item, add to the array
        newState.push(action.payload);
      }
      state.fxContracts = newState;
    },
    setFactoryContractAddress: (state, action: PayloadAction<string>) => {
      state.factoryContractAddress = action.payload;
    },
    setRemittanceContractAddress: (state, action: PayloadAction<string>) => {
      state.remittanceContractAddress = action.payload;
      state.remitTokenAddress = "";
      state.remitTokenId = "";
      state.fxContracts = [];
    },
    setRemitTokenAddress: (state, action: PayloadAction<string>) => {
      state.remitTokenAddress = action.payload;
      state.remitTokenId = TokenId.fromSolidityAddress(
        action.payload
      ).toString();
    },
    setRemitTokenType: (state, action: PayloadAction<number>) => {
      state.remitTokenType = action.payload;
    },
    setSpinAnimation: (state, action: PayloadAction<boolean>) => {
      state.spinAnimation = action.payload ? spinningStyle : "";
    },
    setStableTokenId: (state, action: PayloadAction<string>) => {
      state.stableTokenId = action.payload;
    },
    setStableTokenAddress: (state, action: PayloadAction<string>) => {
      state.stableTokenAddress = action.payload;
    },
  },
});

export const {
  setAlert,
  updateFxContracts,
  setCurrentFxContract,
  setRemittanceContractAddress,
  setRemitTokenAddress,
  setRemitTokenType,
  setSpinAnimation,
  setStableTokenAddress,
  setStableTokenId,
  setFactoryContractAddress,
} = globalStateSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
// @ts-ignore
export const selectState = (state: RootState) => state.globalState;
export const selectAlert = (state: RootState) => state.globalState.alertMessage;
export const selectFxContracts = (state: RootState) =>
  state.globalState.fxContracts;
export const selectCurrentFxContract = (state: RootState) =>
  state.globalState.currentFxContract;
export const selectRemittanceContractAddress = (state: RootState) =>
  state.globalState.remittanceContractAddress;
export const selectRemitTokenAddress = (state: RootState) =>
  state.globalState.remitTokenAddress;
export const selectRemitTokenType = (state: RootState) =>
  state.globalState.remitTokenType;
export const selectRemitTokenId = (state: RootState) =>
  state.globalState.remitTokenId;
export const selectSpinAnimation = (state: RootState) =>
  state.globalState.spinAnimation;
export const selectNetwork = (state: RootState) => state.globalState.network;
export const selectFactoryContractAddress = (state: RootState) =>
  state.globalState.factoryContractAddress;

export default globalStateSlice.reducer;
