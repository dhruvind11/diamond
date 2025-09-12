import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import AxiosRequest from "../../AxiosRequest";
import { toast } from "react-toastify";

interface dashboardStateType {
  dashboardData: any;
  loading: boolean;
  error: string | null;
  paymentLoading: boolean;
  paymentError: string | null;
  paymentSummary: any;
  diwaliCycles: any[];
  cyclesLoading: boolean;
  cyclesError: string | null;
  yearlySummary?: any;
  yearlySummaryLoading: boolean;
  yearlySummaryError?: string | null;
}

const initialState: dashboardStateType = {
  dashboardData: null,
  loading: false,
  error: null,
  paymentLoading: false,
  paymentError: null,
  paymentSummary: null,
  diwaliCycles: [],
  cyclesLoading: false,
  cyclesError: null,
  yearlySummary: {},
  yearlySummaryLoading: false,
  yearlySummaryError: null,
};

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchDashboardData",
  async ({ companyId }: { companyId: string }, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.get(
        `ledger/dashboard-summary/${companyId}`
      );
      return data?.data;
    } catch (error: any) {
      toast.error("Failed to fetch dashboard data");
      return rejectWithValue(error.response?.data?.message || "Unknown error");
    }
  }
);

export const fetchPaymentSummary = createAsyncThunk(
  "dashboard/fetchPaymentSummary",
  async ({ companyId }: { companyId: string }, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.get(
        `ledger/payment-summary/${companyId}`
      );
      return data?.data;
    } catch (error: any) {
      toast.error("Failed to fetch payment summary");
      return rejectWithValue(error.response?.data?.message || "Unknown error");
    }
  }
);

export const fetchDiwaliCycles = createAsyncThunk(
  "dashboard/fetchDiwaliCycles",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.get(`diwali-cycle`);
      return data?.data;
    } catch (error: any) {
      toast.error("Failed to fetch Diwali cycles");
      return rejectWithValue(error.response?.data?.message || "Unknown error");
    }
  }
);

export const fetchYearlySummary = createAsyncThunk(
  "dashboard/fetchYearlySummary",
  async ({ companyId, startDate, endDate }: any, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.post(
        `/ledger/yearly-summary/${companyId}`,
        { startDate, endDate }
      );
      return data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Unknown error");
    }
  }
);
export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDashboardData.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.dashboardData = action.payload;
        }
      )
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPaymentSummary.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(
        fetchPaymentSummary.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.paymentLoading = false;
          state.paymentSummary = action.payload;
        }
      )
      .addCase(fetchPaymentSummary.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload as string;
      })
      .addCase(fetchDiwaliCycles.pending, (state) => {
        state.cyclesLoading = true;
        state.cyclesError = null;
      })
      .addCase(
        fetchDiwaliCycles.fulfilled,
        (state, action: PayloadAction<any[]>) => {
          state.cyclesLoading = false;
          state.diwaliCycles = action.payload;
        }
      )
      .addCase(fetchDiwaliCycles.rejected, (state, action) => {
        state.cyclesLoading = false;
        state.cyclesError = action.payload as string;
      })

      .addCase(fetchYearlySummary.pending, (state) => {
        state.yearlySummaryLoading = true;
        state.yearlySummaryError = null;
      })
      .addCase(
        fetchYearlySummary.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.yearlySummaryLoading = false;
          state.yearlySummary = action.payload;
        }
      )
      .addCase(fetchYearlySummary.rejected, (state, action) => {
        state.yearlySummaryLoading = false;
        state.yearlySummaryError = (action.payload as string) || "Error";
      });
  },
});

export const {} = dashboardSlice.actions;

// export const selectdashboard = (state: RootState) => state.dashboard;

export default dashboardSlice.reducer;
