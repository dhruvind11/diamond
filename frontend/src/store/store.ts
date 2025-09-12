import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import authReducer from "./auth/authSlice";
import userReducer from "./user/userSlice";
import invoiceReducer from "./invoice/invoiceSlice";
import ledgerReducer from "./ledger/ledgerSlice";
import dashboardReducer from "./dashboard/dashboardSlice";
import reportReducer from "./report/reportSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    invoice: invoiceReducer,
    ledger: ledgerReducer,
    dashboard: dashboardReducer,
    report: reportReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => typeof store.dispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
