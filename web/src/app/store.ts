import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import globalStateReducer from '../services/globalStateSlice';
import hashConnectReducer from "../services/hashConnectSlice";

export const store = configureStore({
    reducer: {
        globalState: globalStateReducer,
        hashConnect: hashConnectReducer
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
    >;
