import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { fetchCompanyLedgerAPI, fetchPartyLedgerAPI } from "./ledgerAPI";
import AxiosRequest from "../../AxiosRequest";
// import { RootState } from "../store";

export const getCompanyLedger = createAsyncThunk(
  "ledger/getCompanyLedger",
  async (companyId: string, { rejectWithValue }) => {
    try {
      return await fetchCompanyLedgerAPI(companyId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getPartyLedger = createAsyncThunk(
  "ledger/getPartyLedger",
  async (
    { companyId, partyId }: { companyId: string; partyId: string },
    { rejectWithValue }
  ) => {
    try {
      return await fetchPartyLedgerAPI(companyId, partyId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

interface LedgerState {
  ledgerData: any[];
  singlePartyLedgerData?: any[];
  loading: boolean;
  error: string | null;
}

const initialState: LedgerState = {
  ledgerData: [],
  singlePartyLedgerData: [],
  loading: false,
  error: null,
};

const ledgerSlice = createSlice({
  name: "ledger",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCompanyLedger.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getCompanyLedger.fulfilled,
        (state, action: PayloadAction<any[]>) => {
          state.loading = false;
          state.ledgerData = action.payload;
        }
      )
      .addCase(
        getCompanyLedger.rejected,
        (state, action: PayloadAction<any | unknown>) => {
          state.loading = false;
          state.error = (action.payload as string) || "Failed to fetch ledger";
        }
      )

      .addCase(getPartyLedger.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPartyLedger.fulfilled,
        (state, action: PayloadAction<any[]>) => {
          state.loading = false;
          state.singlePartyLedgerData = action.payload;
        }
      )
      .addCase(
        getPartyLedger.rejected,
        (state, action: PayloadAction<any | unknown>) => {
          state.loading = false;
          state.error =
            (action.payload as string) || "Failed to fetch party ledger";
        }
      );
  },
});

// export const selectLedger = (state: RootState) => state.ledger.ledgerData;
// export const selectLedgerLoading = (state: RootState) => state.ledger.loading;
// export const selectLedgerError = (state: RootState) => state.ledger.error;

export default ledgerSlice.reducer;
